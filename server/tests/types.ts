export interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  partnerUserId?: string;
  terms: boolean;
}

export interface StudentRegistrationForm extends RegistrationForm {
  zipCode: string;
  referredByCode?: string;
  studentPartnerOrg?: string;
  partnerSite?: string;
  highSchoolId: string;
  college?: string;
}

export interface VolunteerRegistrationForm extends RegistrationForm {
  phone: string;
  volunteerPartnerOrg?: string;
}
