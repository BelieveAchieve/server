const crypto = require('crypto')
const { omit } = require('lodash')
const User = require('../models/User')
const Volunteer = require('../models/Volunteer')
const Student = require('../models/Student')
const MailService = require('./MailService')
const IpAddressService = require('./IpAddressService')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const { PHOTO_ID_STATUS, REFERENCE_STATUS, STATUS } = require('../constants')
const config = require('../config')
const Session = require('../models/Session')
const Sentry = require('@sentry/node')

const getVolunteer = async volunteerId => {
  return Volunteer.findOne({ _id: volunteerId })
}

const calculateHoursTutored = async session => {
  const threeHoursMs = 1000 * 60 * 60 * 3
  const fifteenMinsMs = 1000 * 60 * 15

  const { volunteerJoinedAt, endedAt, messages, volunteer } = session
  if (!volunteer) return 0
  if (!(volunteerJoinedAt && endedAt)) return 0
  // console.log('message sent?')
  // skip if no messages are sent
  // console.log('the sesison bro', session)
  if (messages.length === 0) return 0

  const volunteerJoinDate = new Date(volunteerJoinedAt)
  const sessionEndDate = new Date(endedAt)
  let sessionLengthMs = sessionEndDate - volunteerJoinDate

  // skip if volunteer joined after the session ended
  if (sessionLengthMs < 0) return 0

  let latestMessageIndex = messages.length - 1
  let wasMessageSentAfterSessionEnded =
    messages[latestMessageIndex].createdAt > sessionEndDate

  // get the latest message that was sent within a 15 minute window of the message prior.
  // Sometimes sessions are not ended by either participant and one of the participants may send
  // a message to see if the other participant is still active before ending the session.
  // Exclude these messages when getting the total session end time
  if (sessionLengthMs > threeHoursMs || wasMessageSentAfterSessionEnded) {
    while (
      latestMessageIndex > 0 &&
      (wasMessageSentAfterSessionEnded ||
        messages[latestMessageIndex].createdAt -
          messages[latestMessageIndex - 1].createdAt >
          fifteenMinsMs)
    ) {
      latestMessageIndex--
      wasMessageSentAfterSessionEnded =
        messages[latestMessageIndex].createdAt > sessionEndDate
    }
  }

  const latestMessageDate = new Date(messages[latestMessageIndex].createdAt)

  // skip if the latest message was sent before a volunteer joined
  // or skip if the only messages that were sent were after a session has ended
  if (latestMessageDate <= volunteerJoinDate || wasMessageSentAfterSessionEnded)
    return 0

  sessionLengthMs = latestMessageDate - volunteerJoinDate

  // milliseconds in an hour = (60,000 * 60) = 3,600,000
  return Number((sessionLengthMs / 3600000).toFixed(2))
}

module.exports = {
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
    }

    const isNewlyApproved = isApproved && !volunteerBeforeUpdate.isApproved
    if (isNewlyApproved) UserActionCtrl.accountApproved(volunteerId)
    if (isNewlyApproved && !volunteerBeforeUpdate.isOnboarded)
      MailService.sendApprovedNotOnboardedEmail(volunteerBeforeUpdate)

    for (let i = 0; i < referencesStatus.length; i++) {
      if (
        referencesStatus[i] === REFERENCE_STATUS.REJECTED &&
        volunteerBeforeUpdate.references[i].status !== REFERENCE_STATUS.REJECTED
      )
        UserActionCtrl.rejectedReference(volunteerId, {
          referenceEmail: volunteerBeforeUpdate.references[i].email
        })
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

    if (firstName) query.firstname = { $regex: firstName, $options: 'i' }
    if (lastName) query.lastname = { $regex: lastName, $options: 'i' }
    if (email) query.email = { $regex: email, $options: 'i' }
    if (partnerOrg) {
      if (config.studentPartnerManifests[partnerOrg])
        query.studentPartnerOrg = { $regex: partnerOrg, $options: 'i' }

      if (config.volunteerPartnerManifests[partnerOrg])
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

  calculateHoursTutored,

  updateHoursTutored: async sessionId => {
    const session = await Session.findOne({ _id: sessionId })
      .select('volunteerJoinedAt endedAt messages volunteer')
      .lean()
      .exec()

    try {
      const hoursTutored = await calculateHoursTutored(session)
      if (!hoursTutored) return
      await Volunteer.updateOne(
        { _id: session.volunteer },
        { $inc: { hoursTutored } }
      )
    } catch (error) {
      Sentry.captureException(error)
    }
  }
}
