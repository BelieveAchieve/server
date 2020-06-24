const crypto = require('crypto')
const { omit } = require('lodash')
const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const MailService = require('./MailService')
const {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  LINKEDIN_STATUS
} = require('../constants')

module.exports = {
  parseUser: user => {
    // Approved volunteer
    if (user.isVolunteer && user.isApproved)
      return omit(user, [
        'references',
        'photoIdS3Key',
        'photoIdStatus',
        'linkedInUrl',
        'linkedInStatus'
      ])

    // Student or unapproved volunteer
    return user
  },

  banUser: async ({ userId, banReason }) => {
    return User.updateOne(
      { _id: userId },
      { $set: { isBanned: true, banReason } }
    )
  },

  addPhotoId: async ({ userId }) => {
    const photoIdS3Key = crypto.randomBytes(32).toString('hex')
    await Volunteer.updateOne(
      { _id: userId },
      { $set: { photoIdS3Key, photoIdStatus: PHOTO_ID_STATUS.SUBMITTED } }
    )
    return photoIdS3Key
  },

  addLinkedIn: async ({ userId, linkedInUrl }) => {
    const urlPattern = RegExp(/.*linkedin\.com.*\/in\/.+/)
    const isMatch = urlPattern.test(linkedInUrl)
    if (!isMatch) return false
    await Volunteer.updateOne(
      { _id: userId },
      { $set: { linkedInUrl, linkedInStatus: LINKEDIN_STATUS.SUBMITTED } }
    )
    return true
  },

  addReference: async ({ userId, referenceName, referenceEmail }) => {
    const referenceData = {
      name: referenceName,
      email: referenceEmail
    }
    await Volunteer.updateOne(
      { _id: userId },
      { $push: { references: referenceData } }
    )
  },

  saveReferenceForm: async ({ referenceId, referenceFormData }) => {
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

  deleteReference: async ({ userId, referenceEmail }) => {
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
            $or: [
              { linkedInUrl: { $exists: true }, references: { $size: 1 } },
              { linkedInUrl: { $exists: false }, references: { $size: 2 } }
            ],
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
    referencesStatus,
    linkedInStatus
  }) {
    const statuses = [...referencesStatus, linkedInStatus]
    const minApprovedStatuses = 2
    let amountApproved = 0

    for (const status of statuses) {
      if (status === REFERENCE_STATUS.APPROVED) amountApproved++
    }

    // A volunteer must have the following list items approved before being considered an approved volunteer
    //  1. two references or one reference and a valid LinkedIn url
    //  2. photo id
    const isApproved =
      amountApproved === minApprovedStatuses &&
      photoIdStatus === PHOTO_ID_STATUS.APPROVED

    const [referenceOneStatus, referenceTwoStatus] = referencesStatus
    const update = {
      isApproved,
      photoIdStatus,
      linkedInStatus,
      'references.0.status': referenceOneStatus
    }

    if (referenceTwoStatus) update['references.1.status'] = referenceTwoStatus

    return Volunteer.update({ _id: volunteerId }, update)
  }
}
