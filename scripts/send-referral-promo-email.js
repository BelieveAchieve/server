const mongoose = require('mongoose');
const dbconnect = require('../dbutils/dbconnect');
const User = require('../models/User');
const MailService = require('../services/MailService');

const main = async () => {
  await dbconnect(mongoose);
  try {
    const students = await User.find({
      isVolunteer: false,
      isTestUser: false,
      isFakeUser: false
    })
      .lean()
      .exec();

    for (const student of students) {
      const { firstname: firstName, referralCode, email } = student;
      MailService.sendReferralPromoEmail({ firstName, referralCode, email });
    }
  } catch (error) {
    console.log(error);
  }

  console.log('Done');
  mongoose.disconnect();
};

main();
