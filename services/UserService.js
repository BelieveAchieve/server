const {
  volunteerPartnerManifests,
  studentPartnerManifests
} = require('../partnerManifests')
const crypto = require('crypto')
const { omit } = require('lodash')
const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const Student = require('../models/Student')
const MailService = require('./MailService')
const IpAddressService = require('./IpAddressService')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const {
  PHOTO_ID_STATUS,
  REFERENCE_STATUS,
  STATUS,
  USER_BAN_REASON,
  USER_ACTION,
  EVENTS
} = require('../constants')
const AnalyticsService = require('./AnalyticsService')
const ObjectId = require('mongodb').ObjectId

const getVolunteer = async volunteerId => {
  return Volunteer.findOne({ _id: volunteerId })
}

module.exports = {
  getUser: (query, projection) => {
    return User.findOne(query)
      .select(projection)
      .lean()
      .exec()
  },

  parseUser: user => {
    // Approved volunteer
    if (user.isVolunteer && user.isApproved) {
      user.hoursTutored = user.hoursTutored.toString()
      return omit(user, ['references', 'photoIdS3Key', 'photoIdStatus'])
    }

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

  addReference: async ({
    userId,
    referenceFirstName,
    referenceLastName,
    referenceEmail,
    ip
  }) => {
    const referenceData = {
      firstName: referenceFirstName,
      lastName: referenceLastName,
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
    AnalyticsService.captureEvent(userId, EVENTS.REFERENCE_DELETED, {
      action: EVENTS.REFERENCE_DELETED,
      referenceEmail
    })
    return Volunteer.updateOne(
      { _id: userId },
      { $pull: { references: { email: referenceEmail } } }
    )
  },

  getVolunteersToReview: async function(page) {
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
            },
            occupation: { $ne: null },
            country: { $ne: null }
          }
        },
        {
          $project: {
            firstname: 1,
            lastname: 1,
            email: 1,
            createdAt: 1
          }
        },
        {
          $lookup: {
            from: 'useractions',
            localField: '_id',
            foreignField: 'user',
            as: 'userAction'
          }
        },
        {
          $unwind: '$userAction'
        },
        {
          $match: {
            'userAction.action': {
              $in: [
                USER_ACTION.ACCOUNT.ADDED_PHOTO_ID,
                USER_ACTION.ACCOUNT.SUBMITTED_REFERENCE_FORM,
                USER_ACTION.ACCOUNT.COMPLETED_BACKGROUND_INFO
              ]
            }
          }
        },
        {
          $group: {
            _id: '$_id',
            firstname: { $first: '$firstname' },
            lastname: { $first: '$lastname' },
            email: { $first: '$email' },
            // Get the date of their latest user action associated with the approval process
            readyForReviewAt: {
              $max: '$userAction.createdAt'
            }
          }
        }
      ])
        .sort({ readyForReviewAt: 1 })
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

    await Volunteer.update({ _id: volunteerId }, update)

    if (
      photoIdStatus === PHOTO_ID_STATUS.REJECTED &&
      volunteerBeforeUpdate.photoIdStatus !== PHOTO_ID_STATUS.REJECTED
    ) {
      UserActionCtrl.rejectedPhotoId(volunteerId)
      AnalyticsService.captureEvent(volunteerId, EVENTS.PHOTO_ID_REJECTED, {
        action: EVENTS.PHOTO_ID_REJECTED
      })
      MailService.sendRejectedPhotoSubmission(volunteerBeforeUpdate)
    }

    const isNewlyApproved = isApproved && !volunteerBeforeUpdate.isApproved
    if (isNewlyApproved) {
      UserActionCtrl.accountApproved(volunteerId)
      AnalyticsService.captureEvent(volunteerId, EVENTS.ACCOUNT_APPROVED, {
        action: EVENTS.ACCOUNT_APPROVED
      })
    }
    if (isNewlyApproved && !volunteerBeforeUpdate.isOnboarded)
      MailService.sendApprovedNotOnboardedEmail(volunteerBeforeUpdate)

    for (let i = 0; i < referencesStatus.length; i++) {
      const reference = volunteerBeforeUpdate.references[i]
      if (
        referencesStatus[i] === REFERENCE_STATUS.REJECTED &&
        reference.status !== REFERENCE_STATUS.REJECTED
      ) {
        UserActionCtrl.rejectedReference(volunteerId, {
          referenceEmail: reference.email
        })
        AnalyticsService.captureEvent(volunteerId, EVENTS.REFERENCE_REJECTED, {
          action: EVENTS.REFERENCE_REJECTED,
          referenceEmail: reference.email
        })
        MailService.sendRejectedReference({
          volunteer: volunteerBeforeUpdate,
          reference
        })
      }
    }
  },

  addBackgroundInfo: async function({ volunteerId, update, ip }) {
    const { volunteerPartnerOrg } = await getVolunteer(volunteerId)
    if (volunteerPartnerOrg) {
      update.isApproved = true
      UserActionCtrl.accountApproved(volunteerId)
      // @todo: if not onboarded, send a partner-specific version of the "approved but not onboarded" email
    }

    // remove fields with empty strings and empty arrays from the update
    for (const field in update) {
      if (
        (Array.isArray(update[field]) && update[field].length === 0) ||
        update[field] === ''
      )
        delete update[field]
    }

    UserActionCtrl.completedBackgroundInfo(volunteerId, ip)
    return Volunteer.update({ _id: volunteerId }, update)
  },

  adminUpdateUser: async function({
    userId,
    firstName,
    lastName,
    email,
    partnerOrg,
    partnerSite,
    isVerified,
    isBanned,
    isDeactivated,
    isApproved
  }) {
    const userBeforeUpdate = await this.getUser({ _id: userId })
    const { isVolunteer } = userBeforeUpdate
    const isUpdatedEmail = userBeforeUpdate.email !== email

    // Remove the contact associated with the previous email from SendGrid
    if (isUpdatedEmail) {
      const contact = await MailService.searchContact(userBeforeUpdate.email)
      if (contact) MailService.deleteContact(contact.id)
    }

    // if unbanning student, also unban their IP addresses
    if (!isVolunteer && userBeforeUpdate.isBanned && !isBanned)
      await IpAddressService.unbanUserIps(userBeforeUpdate)

    if (!userBeforeUpdate.isBanned && isBanned)
      MailService.sendBannedUserAlert({
        userId,
        banReason: USER_BAN_REASON.ADMIN
      })

    const update = {
      firstname: firstName,
      lastname: lastName,
      email,
      verified: isVerified,
      isBanned,
      isDeactivated,
      isApproved,
      $unset: {}
    }

    if (isVolunteer) {
      if (partnerOrg) update.volunteerPartnerOrg = partnerOrg
      else update.$unset.volunteerPartnerOrg = ''
    }

    if (!isVolunteer) {
      if (partnerOrg) update.studentPartnerOrg = partnerOrg
      else update.$unset.studentPartnerOrg = ''

      if (partnerSite) update.partnerSite = partnerSite
      else update.$unset.partnerSite = ''
    }

    if (isBanned) update.banReason = USER_BAN_REASON.ADMIN
    if (isDeactivated && !userBeforeUpdate.isDeactivated)
      UserActionCtrl.adminDeactivatedAccount(userId)

    // Remove $unset property if it has no properties to remove
    if (Object.keys(update.$unset).length === 0) delete update.$unset

    const updatedUser = Object.assign(userBeforeUpdate, update)
    MailService.createContact(updatedUser)

    if (isVolunteer) {
      return Volunteer.updateOne({ _id: userId }, update)
    } else {
      return Student.updateOne({ _id: userId }, update)
    }
  },

  getUsers: async function({
    userId,
    firstName,
    lastName,
    email,
    partnerOrg,
    highSchool,
    page
  }) {
    const query = {}
    const pageNum = parseInt(page) || 1
    const PER_PAGE = 15
    const skip = (pageNum - 1) * PER_PAGE

    if (userId) query._id = ObjectId(userId)
    if (firstName) query.firstname = { $regex: firstName, $options: 'i' }
    if (lastName) query.lastname = { $regex: lastName, $options: 'i' }
    if (email) query.email = { $regex: email, $options: 'i' }
    if (partnerOrg) {
      if (studentPartnerManifests[partnerOrg])
        query.studentPartnerOrg = { $regex: partnerOrg, $options: 'i' }

      if (volunteerPartnerManifests[partnerOrg])
        query.volunteerPartnerOrg = { $regex: partnerOrg, $options: 'i' }
    }

    let highSchoolQuery = [
      {
        $lookup: {
          from: 'schools',
          localField: 'approvedHighschool',
          foreignField: '_id',
          as: 'highSchool'
        }
      },
      {
        $unwind: '$highSchool'
      },
      {
        $match: {
          $or: [
            { 'highSchool.nameStored': { $regex: highSchool, $options: 'i' } },
            { 'highSchool.SCH_NAME': { $regex: highSchool, $options: 'i' } }
          ]
        }
      }
    ]

    const aggregateQuery = [{ $match: query }]
    if (highSchool) aggregateQuery.push(...highSchoolQuery)

    try {
      const users = await User.aggregate(aggregateQuery)
        .skip(skip)
        .limit(PER_PAGE)
        .exec()

      const isLastPage = users.length < PER_PAGE
      return { users, isLastPage }
    } catch (error) {
      throw new Error(error.message)
    }
  },

  // @note: this query is making a request for user data on every page transition
  //        for new pastSessions to display. May be better served as a separate
  //        service method for getting the user's past sessions
  adminGetUser: async function(userId, page) {
    const [results] = await User.aggregate([
      {
        $match: {
          _id: ObjectId(userId)
        }
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          email: 1,
          createdAt: 1,
          isVolunteer: 1,
          isApproved: 1,
          isAdmin: 1,
          isBanned: 1,
          isDeactivated: 1,
          isTestUser: 1,
          isFakeUser: 1,
          partnerSite: 1,
          zipCode: 1,
          background: 1,
          studentPartnerOrg: 1,
          volunteerPartnerOrg: 1,
          approvedHighschool: 1,
          photoIdS3Key: 1,
          photoIdStatus: 1,
          references: 1,
          occupation: 1,
          country: 1,
          verified: 1,
          numPastSessions: { $size: '$pastSessions' },
          pastSessions: { $slice: ['$pastSessions', -10 * page, 10] }
        }
      },
      {
        $facet: {
          user: [
            {
              $lookup: {
                from: 'schools',
                localField: 'approvedHighschool',
                foreignField: '_id',
                as: 'approvedHighschool'
              }
            },
            {
              $unwind: {
                path: '$approvedHighschool',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          pastSessions: [
            {
              $unwind: {
                path: '$pastSessions'
              }
            },
            {
              $lookup: {
                from: 'sessions',
                let: {
                  sessionId: '$pastSessions'
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', '$$sessionId']
                      }
                    }
                  },
                  {
                    $project: {
                      type: 1,
                      subTopic: 1,
                      totalMessages: {
                        $size: '$messages'
                      },
                      volunteer: 1,
                      student: 1,
                      volunteerJoinedAt: 1,
                      createdAt: 1,
                      endedAt: 1
                    }
                  }
                ],
                as: 'pastSessions'
              }
            },
            {
              $unwind: {
                path: '$pastSessions'
              }
            },
            {
              $replaceRoot: {
                newRoot: '$pastSessions'
              }
            }
          ]
        }
      }
    ])

    const user = {
      ...results.user[0],
      pastSessions: results.pastSessions
    }

    return user
  }
}
