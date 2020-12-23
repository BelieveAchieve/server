import { IVolunteer, Availability } from '../models/types';

export interface UpdateScheduleOptions {
  user: IVolunteer;
  availability: Availability;
  tz: string;
  ip?: string;
}
