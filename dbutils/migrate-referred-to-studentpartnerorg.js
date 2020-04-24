const mongoose = require('mongoose')
const dbconnect = require('./dbconnect')
const User = require('../models/User')

/**
 * Convert old User.referred vals to User.studentPartnerOrg vals
 */
const main = async () => {
  await dbconnect(mongoose)

  const studentPartners = [
    {
      referred: 'Big Brothers Big Sisters of NYC',
      studentPartnerOrg: 'bbbs-nyc'
    },
    {
      referred: 'Breakthrough New York',
      studentPartnerOrg: 'btny'
    },
    {
      referred: 'East Harlem Tutorial Program',
      studentPartnerOrg: 'ehtp'
    },
    {
      referred: 'First Graduate',
      studentPartnerOrg: 'first-graduate'
    },
    {
      referred: 'Oasis - A Heaven for Women and Children',
      studentPartnerOrg: 'oasis'
    },
    {
      referred: 'NYC Mission Society',
      studentPartnerOrg: 'nyc-mission'
    },
    {
      referred: 'None of the above',
      studentPartnerOrg: null
    },
    {
      referred: 'No',
      studentPartnerOrg: null
    }
  ];

  try {
    for (const partner of studentPartners) {
      const match = { referred: partner.referred }
      const update = { $unset: { referred: 1 } }

      if (partner.studentPartnerOrg) {
        update['$set'] = { studentPartnerOrg: partner.studentPartnerOrg }
      }

      // With strict mode off you can delete properties that are no longer defined in the schema
      const result = await User.updateMany(match, update, { strict: false } )

      console.log(`${partner.referred} --> ${partner.studentPartnerOrg}:`, result)
    }
  } catch (error) {
    console.log(error)
  }

  console.log('Done')
  mongoose.disconnect()
}

main()
