import { Response } from 'express';
import User from '../../models/User';
import config from '../../config';

// Validation functions
export async function newCredentialsInvalid(
  password: string,
  email: string,
  res: Response
): Promise<Response> {
  if (!email || !password) {
    return res.status(422).json({
      err: 'Must supply an email and password for registration'
    });
  }

  if (password.length < 8) {
    return res.status(422).json({
      err: 'Password must be 8 characters or longer'
    });
  }

  if (!/\p{Lu}/u.test(password)) {
    return res.status(422).json({
      err: 'Password must contain at least one uppercase letter'
    });
  }

  if (!/\p{Ll}/u.test(password)) {
    return res.status(422).json({
      err: 'Password must contain at least one lowercase letter'
    });
  }

  if (!/\d/.test(password)) {
    return res.status(422).json({
      err: 'Password must contain at least one number'
    });
  }

  const users = await User.find({ email: email });
  if (users.length !== 0) {
    return res.status(409).json({
      err: 'The email address you entered is already in use'
    });
  }
}

export function invalidPartnerOrg(
  highSchoolUpchieveId: string,
  zipCode: string,
  studentPartnerOrg: string
): boolean {
  if (!highSchoolUpchieveId && !zipCode) {
    const allStudentPartnerManifests = config.studentPartnerManifests;
    const studentPartnerManifest =
      allStudentPartnerManifests[studentPartnerOrg];
    return !studentPartnerManifest;
  }
}

export function invalidVolunteerOrg(volunteerPartnerOrg: string): boolean {
  const allVolunteerPartnerManifests = config.volunteerPartnerManifests;
  const volunteerPartnerManifest =
    allVolunteerPartnerManifests[volunteerPartnerOrg];
  return !volunteerPartnerManifest;
}

export function invalidVolunteerEmailDomain(
  volunteerPartnerOrg: string,
  email: string
): boolean {
  const allVolunteerPartnerManifests = config.volunteerPartnerManifests;
  const volunteerPartnerManifest =
    allVolunteerPartnerManifests[volunteerPartnerOrg];
  const volunteerPartnerDomains = volunteerPartnerManifest.requiredEmailDomains;
  if (volunteerPartnerDomains && volunteerPartnerDomains.length) {
    const userEmailDomain = email.split('@')[1];
    return volunteerPartnerDomains.indexOf(userEmailDomain) === -1;
  }
  return false;
}
