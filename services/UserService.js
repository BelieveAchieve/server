const crypto = require('crypto')
const { omit } = require('lodash')
const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const MailService = require('./MailService')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const { PHOTO_ID_STATUS, REFERENCE_STATUS, STATUS } = require('../constants')

const getVolunteer = async volunteerId => {
  return Volunteer.findOne({ _id: volunteerId })
}

module.exports = {
  getVolunteer,

  getUser: query => {
    return User.findOne(query)
      .lean()
      .exec()
  },

  parseUser: user => {
    // Approved volunteer
    if (user.isVolunteer && user.isApproved)
      return omit(user, ['references', 'photoIdS3Key', 'photoIdStatus'])

    // Student or unapproved volunteer
    return user
  },

  banUser: async ({ userId, banReason }) => {
    return User.updateOne(
      { _id: userId },
      { $set: { isBanned: true, banReason } }
    )
  },

  addPhotoId: async ({ userId, ip }) => {
    const photoIdS3Key = crypto.randomBytes(32).toString('hex')
    UserActionCtrl.addedPhotoId(userId, ip)
    await Volunteer.updateOne(
      { _id: userId },
      { $set: { photoIdS3Key, photoIdStatus: PHOTO_ID_STATUS.SUBMITTED } }
    )
    return photoIdS3Key
  },

  addReference: async ({ userId, referenceName, referenceEmail, ip }) => {
    const referenceData = {
      name: referenceName,
      email: referenceEmail
    }
    await Volunteer.updateOne(
      { _id: userId },
      { $push: { references: referenceData } }
    )
    UserActionCtrl.addedReference(userId, ip, {
      referenceEmail
    })
  },

  saveReferenceForm: async ({
    userId,
    referenceId,
    referenceEmail,
    referenceFormData,
    ip
  }) => {
    const {
      affiliation,
      relationshipLength,
      rejectionReason,
      additionalInfo,
      patient,
      positiveRoleModel,
      agreeableAndApproachable,
      communicatesEffectively,
      trustworthyWithChildren
    } = referenceFormData

    UserActionCtrl.submittedReferenceForm(userId, ip, { referenceEmail })

    // See: https://docs.mongodb.com/manual/reference/operator/update/positional/#up._S_
    return Volunteer.updateOne(
      { 'references._id': referenceId },
      {
        $set: {
          'references.$.status': REFERENCE_STATUS.SUBMITTED,
          'references.$.affiliation': affiliation,
          'references.$.relationshipLength': relationshipLength,
          'references.$.rejectionReason': rejectionReason,
          'references.$.additionalInfo': additionalInfo,
          'references.$.patient': patient,
          'references.$.positiveRoleModel': positiveRoleModel,
          'references.$.agreeableAndApproachable': agreeableAndApproachable,
          'references.$.communicatesEffectively': communicatesEffectively,
          'references.$.trustworthyWithChildren': trustworthyWithChildren
        }
      }
    )
  },

  notifyReference: async ({ reference, volunteer }) => {
    // @todo: error handling
    await MailService.sendReferenceForm({ reference, volunteer })
    return Volunteer.updateOne(
      { 'references._id': reference._id },
      {
        $set: {
          'references.$.status': REFERENCE_STATUS.SENT,
          'references.$.sentAt': Date.now()
        }
      }
    )
  },

  deleteReference: async ({ userId, referenceEmail, ip }) => {
    UserActionCtrl.deletedReference(userId, ip, { referenceEmail })
    return Volunteer.updateOne(
      { _id: userId },
      { $pull: { references: { email: referenceEmail } } }
    )
  },

  getPendingVolunteers: async function(page) {
    const pageNum = parseInt(page) || 1
    const PER_PAGE = 15
    const skip = (pageNum - 1) * PER_PAGE

    try {
      const volunteers = await Volunteer.aggregate([
        {
          $match: {
            isApproved: false,
            photoIdS3Key: { $ne: null },
            photoIdStatus: {
              $in: [PHOTO_ID_STATUS.SUBMITTED, PHOTO_ID_STATUS.APPROVED]
            },
            references: { $size: 2 },
            'references.status': {
              $nin: [
                REFERENCE_STATUS.REJECTED,
                REFERENCE_STATUS.UNSENT,
                REFERENCE_STATUS.SENT
              ]
            }
          }
        },
        {
          $project: {
            firstname: 1,
            lastname: 1,
            email: 1,
            createdAt: 1
          }
        }
      ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PER_PAGE)

      const isLastPage = volunteers.length < PER_PAGE
      return { volunteers, isLastPage }
    } catch (error) {
      throw new Error(error.message)
    }
  },

  updatePendingVolunteerStatus: async function({
    volunteerId,
    photoIdStatus,
    referencesStatus
  }) {
    const volunteerBeforeUpdate = await getVolunteer(volunteerId)
    const hasCompletedBackgroundInfo =
      volunteerBeforeUpdate.occupation &&
      volunteerBeforeUpdate.occupation.length > 0 &&
      volunteerBeforeUpdate.background &&
      volunteerBeforeUpdate.background.length > 0 &&
      volunteerBeforeUpdate.country
    const statuses = [...referencesStatus, photoIdStatus]
    // A volunteer must have the following list items approved before being considered an approved volunteer
    //  1. two references
    //  2. photo id
    const isApproved =
      statuses.every(status => status === STATUS.APPROVED) &&
      !!hasCompletedBackgroundInfo
    const [referenceOneStatus, referenceTwoStatus] = referencesStatus
    const update = {
      isApproved,
      photoIdStatus,
      'references.0.status': referenceOneStatus,
      'references.1.status': referenceTwoStatus
    }

    if (photoIdStatus === STATUS.REJECTED)
      UserActionCtrl.rejectedPhotoId(volunteerId)

    // @todo: volunteer-signup - pending merge with incoming emails pr
    for (let i = 0; i < referencesStatus.length; i++) {
      if (referencesStatus[i] === STATUS.REJECTED)
        UserActionCtrl.rejectedReference(volunteerId, {
          referenceEmail: references[i].email
        })
    }

    // @todo: volunteer-signup - merge with incoming emails pr
    if (isApproved) UserActionCtrl.accountApproved(volunteerId)

    await Volunteer.update({ _id: volunteerId }, update)
  },

  addBackgroundInfo: async function({ volunteerId, update, ip }) {
    const {
      volunteerPartnerOrg,
      references,
      photoIdStatus,
      isApproved
    } = await getVolunteer(volunteerId)
    let isFinalApprovalStep = false

    if (!isApproved && !volunteerPartnerOrg && references.length === 2) {
      const referencesStatus = references.map(reference => reference.status)
      const statuses = [...referencesStatus, photoIdStatus]

      isFinalApprovalStep = statuses.every(status => status === STATUS.APPROVED)
    }

    if (volunteerPartnerOrg || isFinalApprovalStep) update.isApproved = true

    // remove fields with empty strings and empty arrays from the update
    for (const field in update) {
      if (
        (Array.isArray(update[field]) && update[field].length === 0) ||
        update[field] === ''
      )
        delete update[field]
    }

    UserActionCtrl.completedBackgroundInfo(volunteerId, ip)
    if (update.isApproved) UserActionCtrl.accountApproved(volunteerId, ip)
    return Volunteer.update({ _id: volunteerId }, update)
  }
}
