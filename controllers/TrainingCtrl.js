const _ = require('lodash')
const UserActionCtrl = require('../controllers/UserActionCtrl')
const Question = require('../models/Question')
const Volunteer = require('../models/Volunteer')
const {
  CERT_UNLOCKING,
  COMPUTED_CERTS,
  TRAINING,
  MATH_CERTS,
  SCIENCE_CERTS,
  SAT_CERTS,
  SUBJECT_TYPES,
  COLLEGE_CERTS,
  COLLEGE_SUBJECTS
} = require('../constants')
const getSubjectType = require('../utils/getSubjectType')
const MailService = require('../services/MailService')

// change depending on how many of each subcategory are wanted
const numQuestions = {
  [MATH_CERTS.PREALGREBA]: 2,
  [MATH_CERTS.ALGEBRA]: 2,
  [MATH_CERTS.GEOMETRY]: 2,
  [MATH_CERTS.TRIGONOMETRY]: 2,
  [MATH_CERTS.STATISTICS]: 1,
  [MATH_CERTS.PRECALCULUS]: 2,
  [MATH_CERTS.CALCULUS_AB]: 1,
  [MATH_CERTS.CALCULUS_BC]: 1,
  [COLLEGE_CERTS.ESSAYS]: 3,
  // @note: Once College Counseling is implemented Planning and Applications will be phased to subjects that are unlocked instead of certs
  [COLLEGE_SUBJECTS.PLANNING]: 4,
  [COLLEGE_SUBJECTS.APPLICATIONS]: 2,
  [SCIENCE_CERTS.BIOLOGY]: 1,
  [SCIENCE_CERTS.CHEMISTRY]: 1,
  [SCIENCE_CERTS.PHYSICS_ONE]: 1,
  [SCIENCE_CERTS.PHYSICS_TWO]: 1,
  [SCIENCE_CERTS.ENVIRONMENTAL_SCIENCE]: 1,
  [TRAINING.UPCHIEVE_101]: 27
}
const SUBJECT_THRESHOLD = 0.8
const TRAINING_THRESHOLD = 1.0

// Check if a user is certified in a given group of subject certs
const isCertifiedIn = (subjectCerts, certifications) => {
  for (let cert in subjectCerts) {
    const subject = subjectCerts[cert]
    if (certifications[subject].passed) return true
  }

  return false
}

module.exports = {
  getQuestions: async function(options) {
    const { category } = options
    const subcategories = Question.getSubcategories(category)

    if (!subcategories) {
      throw new Error('No subcategories defined for category: ' + category)
    }

    const questions = await Question.find({
      category
    })

    const questionsBySubcategory = _.groupBy(
      questions,
      question => question.subcategory
    )

    return _.shuffle(
      Object.entries(questionsBySubcategory).flatMap(([, subQuestions]) =>
        _.sampleSize(subQuestions, numQuestions[category])
      )
    )
  },

  getQuizScore: async function({ user, idAnswerMap, category: cert, ip }) {
    const objIDs = Object.keys(idAnswerMap)
    const questions = await Question.find({ _id: { $in: objIDs } }).exec()

    const score = questions.filter(
      question => question.correctAnswer === idAnswerMap[question._id]
    ).length

    const percent = score / questions.length
    const threshold = Object.values(TRAINING).includes(cert)
      ? TRAINING_THRESHOLD
      : SUBJECT_THRESHOLD
    const passed = percent >= threshold

    const tries = user.certifications[cert]['tries'] + 1

    const userUpdates = {
      [`certifications.${cert}.passed`]: passed,
      [`certifications.${cert}.tries`]: tries,
      [`certifications.${cert}.lastAttemptedAt`]: new Date()
    }

    if (passed) {
      const unlockedSubjects = this.getUnlockedSubjects(
        cert,
        user.certifications
      )

      // set custom field passedUpchieve101 in SendGrid
      if (cert === TRAINING.UPCHIEVE_101) MailService.createContact(user)

      // Create a user action for every subject unlocked
      for (const subject of unlockedSubjects) {
        if (!user.subjects.includes(subject))
          UserActionCtrl.unlockedSubject(user, subject, ip)
      }

      userUpdates.$addToSet = { subjects: unlockedSubjects }

      if (
        !user.isOnboarded &&
        user.availabilityLastModifiedAt &&
        unlockedSubjects.length > 0
      ) {
        userUpdates.isOnboarded = true
        UserActionCtrl.accountOnboarded(user._id, ip)
      }
    }

    await Volunteer.updateOne({ _id: user._id }, userUpdates, {
      runValidators: true
    })

    const idCorrectAnswerMap = questions.reduce((correctAnswers, question) => {
      correctAnswers[question._id] = question.correctAnswer
      return correctAnswers
    }, {})

    return {
      tries,
      passed,
      score,
      idCorrectAnswerMap
    }
  },

  getUnlockedSubjects: function(cert, userCertifications) {
    // update certifications to have the current cert completed set to passed
    Object.assign(userCertifications, {
      [cert]: { passed: true },
      // @note: temporarily bypass training requirements until these training courses are added
      [TRAINING.TUTORING_SKILLS]: { passed: true },
      [TRAINING.COLLEGE_COUNSELING]: { passed: true }
    })

    // UPchieve 101 must be completed before a volunteer can be onboarded
    if (!userCertifications[TRAINING.UPCHIEVE_101].passed) return []

    const certType = getSubjectType(cert)

    // Check if the user has a certification for the required training
    if (
      certType === SUBJECT_TYPES.TRAINING &&
      !this.hasCertForRequiredTraining(cert, userCertifications)
    )
      return []

    // Check if the user has completed required training for this cert
    if (
      certType !== SUBJECT_TYPES.TRAINING &&
      !this.hasRequiredTraining(cert, userCertifications)
    )
      return []

    // Add all the certifications that this completed cert unlocks into a Set
    const currentSubjects = new Set(CERT_UNLOCKING[cert])

    for (const cert in userCertifications) {
      // Check that the required training was completed for every certification that a user has
      // Add all the other subjects that a certification unlocks to the Set
      if (
        userCertifications[cert].passed &&
        this.hasRequiredTraining(cert, userCertifications) &&
        CERT_UNLOCKING[cert]
      )
        CERT_UNLOCKING[cert].forEach(subject => currentSubjects.add(subject))
    }

    // Check if the user has unlocked a new certification based on the current certifications they have
    for (const cert in COMPUTED_CERTS) {
      const prerequisiteCerts = COMPUTED_CERTS[cert]
      let meetsRequirements = true

      for (let i = 0; i < prerequisiteCerts.length; i++) {
        const prereqCert = prerequisiteCerts[i]

        // SAT Math can be unlocked from taking Geometry, Trigonometry, and Algebra or
        // from Calculus AB, Calculus BC, and Precalculus - none of which unlock Geometry
        if (
          cert === SAT_CERTS.SAT_MATH &&
          currentSubjects.has(MATH_CERTS.PRECALCULUS)
        )
          break

        if (!currentSubjects.has(prereqCert)) {
          meetsRequirements = false
          break
        }
      }

      if (meetsRequirements) currentSubjects.add(cert)
    }

    // SAT Math is a special case, it can be unlocked by multiple math certs, but must have SAT Strategies completed
    if (
      currentSubjects.has(SAT_CERTS.SAT_MATH) &&
      !userCertifications[TRAINING.SAT_STRATEGIES].passed
    )
      currentSubjects.delete(SAT_CERTS.SAT_MATH)

    return Array.from(currentSubjects)
  },

  // Check if a given cert has the required training completed
  hasRequiredTraining: function(subjectCert, userCertifications) {
    const subjectCertType = getSubjectType(subjectCert).toLowerCase()

    if (
      (subjectCertType === SUBJECT_TYPES.MATH ||
        subjectCertType === SUBJECT_TYPES.SCIENCE) &&
      userCertifications[TRAINING.TUTORING_SKILLS].passed
    )
      return true

    if (
      subjectCertType === SUBJECT_TYPES.COLLEGE &&
      userCertifications[TRAINING.COLLEGE_COUNSELING].passed
    )
      return true

    if (
      subjectCertType === SUBJECT_TYPES.SAT &&
      userCertifications[TRAINING.SAT_STRATEGIES].passed
    )
      return true

    return false
  },

  // Check if a required training cert has any associated passed certifications for it
  hasCertForRequiredTraining: function(trainingCert, userCertifications) {
    // UPchieve 101 doesn't need any associated certs
    if (trainingCert === TRAINING.UPCHIEVE_101) return true

    // College counseling unlocks Planning and Essays by default, meaning no requirements are needed to unlock the college related certifications besides completing the required training
    if (trainingCert === TRAINING.COLLEGE_COUNSELING) return true

    if (
      trainingCert === TRAINING.TUTORING_SKILLS &&
      isCertifiedIn({ ...MATH_CERTS, ...SCIENCE_CERTS }, userCertifications)
    )
      return true

    if (
      trainingCert === TRAINING.SAT_STRATEGIES &&
      isCertifiedIn(SAT_CERTS, userCertifications)
    )
      return true

    return false
  }
}
