/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/camelcase */
import mongoose from 'mongoose';
import axios from 'axios';
import Student from '../models/Student';
import Volunteer from '../models/Volunteer';
import dbconnect from './dbconnect';
import config from '../config';

const options = {
  headers: {
    Authorization: `Bearer ${config.sendgrid.apiKey}`,
    'content-type': 'application/json'
  }
};

const SG_CUSTOM_FIELDS = {
  isBanned: 'e3_T',
  isTestUser: 'e4_T',
  isVolunteer: 'e6_T',
  isAdmin: 'e7_T',
  isFakeUser: 'e8_T',
  isDeactivated: 'e9_T',
  joined: 'e10_D',
  studentPartnerOrg: 'e11_T',
  studentPartnerOrgDisplay: 'e12_T',
  volunteerPartnerOrg: 'e13_T',
  volunteerPartnerOrgDisplay: 'e14_T',
  passedUpchieve101: 'e17_T'
};

const putContact = data =>
  axios.put('https://api.sendgrid.com/v3/marketing/contacts', data, options);

const createStudentContacts = async users => {
  const contacts = users.map(user => {
    const customFields = {
      [SG_CUSTOM_FIELDS.isBanned]: String(user.isBanned),
      [SG_CUSTOM_FIELDS.isTestUser]: String(user.isTestUser),
      [SG_CUSTOM_FIELDS.isVolunteer]: String(user.isVolunteer),
      [SG_CUSTOM_FIELDS.isAdmin]: String(user.isAdmin),
      [SG_CUSTOM_FIELDS.isFakeUser]: String(user.isFakeUser),
      [SG_CUSTOM_FIELDS.isDeactivated]: String(user.isDeactivated),
      [SG_CUSTOM_FIELDS.joined]: user.createdAt
    };

    if (user.studentPartnerOrg) {
      customFields[SG_CUSTOM_FIELDS.studentPartnerOrg] = user.studentPartnerOrg;
      if (config.studentPartnerManifests[user.studentPartnerOrg]) {
        customFields[SG_CUSTOM_FIELDS.studentPartnerOrgDisplay] =
          config.studentPartnerManifests[user.studentPartnerOrg].name;
      }
    }

    const contact = {
      first_name: user.firstname,
      last_name: user.lastname,
      email: user.email,
      custom_fields: customFields
    }

    return contact;
  });

  const data = {
    list_ids: [config.sendgrid.contactList.students],
    contacts
  };
  return putContact(JSON.stringify(data));
};

const createVolunteerContacts = async users => {
  const contacts = users.map(user => {
    const customFields = {
      [SG_CUSTOM_FIELDS.isBanned]: String(user.isBanned),
      [SG_CUSTOM_FIELDS.isTestUser]: String(user.isTestUser),
      [SG_CUSTOM_FIELDS.isVolunteer]: String(user.isVolunteer),
      [SG_CUSTOM_FIELDS.isAdmin]: String(user.isAdmin),
      [SG_CUSTOM_FIELDS.isFakeUser]: String(user.isFakeUser),
      [SG_CUSTOM_FIELDS.isDeactivated]: String(user.isDeactivated),
      [SG_CUSTOM_FIELDS.joined]: user.createdAt
    };

    if (user.isVolunteer)
    customFields[SG_CUSTOM_FIELDS.passedUpchieve101] = String(
      user.certifications.upchieve101.passed
    )

    const parterOrg = user.volunteerPartnerOrg
    if (parterOrg) {
      customFields[SG_CUSTOM_FIELDS.volunteerPartnerOrg] = parterOrg;
      if (config.volunteerPartnerManifests[parterOrg]) {
        customFields[SG_CUSTOM_FIELDS.volunteerPartnerOrgDisplay] =
          config.volunteerPartnerManifests[parterOrg].name;
      }
    }

    const contact = {
      first_name: user.firstname,
      last_name: user.lastname,
      email: user.email,
      custom_fields: customFields
    }

    return contact;
  });

  const data = {
    list_ids: [config.sendgrid.contactList.volunteers],
    contacts
  };

  return putContact(JSON.stringify(data));
};

const main = async (): Promise<void> => {
  await dbconnect();

  try {
    const students = await Student.find({})
      .lean()
      .exec();
    const volunteers = await Volunteer.find({})
      .lean()
      .exec();

    const studentResponse = await createStudentContacts(students);
    const volunteerResponse = await createVolunteerContacts(volunteers);

    console.log('Student job id', studentResponse.data);
    console.log('Volunteer job id', volunteerResponse.data);
  } catch (error) {
    console.log('the errors', error.message);
  }

  mongoose.disconnect();
};

main();
