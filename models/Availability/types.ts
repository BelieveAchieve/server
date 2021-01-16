import { Schema } from 'mongoose';

export enum DAYS {
  SUNDAY = 'Sunday',
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday'
}

export enum HOURS {
  '12AM' = '12a',
  '1AM' = '1a',
  '2AM' = '2a',
  '3AM' = '3a',
  '4AM' = '4a',
  '5AM' = '5a',
  '6AM' = '6a',
  '7AM' = '7a',
  '8AM' = '8a',
  '9AM' = '9a',
  '10AM' = '10a',
  '11AM' = '11a',
  '12PM' = '12p',
  '1PM' = '1p',
  '2PM' = '2p',
  '3PM' = '3p',
  '4PM' = '4p',
  '5PM' = '5p',
  '6PM' = '6p',
  '7PM' = '7p',
  '8PM' = '8p',
  '9PM' = '9p',
  '10PM' = '10p',
  '11PM' = '11p'
}

export type AvailabilityDay = {
  [hour in HOURS]: boolean;
};

export type Availability = {
  [day in DAYS]: AvailabilityDay;
};

// subdocument schema for each availability day
export const availabilityDaySchema = new Schema(
  {
    [HOURS['12AM']]: { type: Boolean, default: false },
    [HOURS['1AM']]: { type: Boolean, default: false },
    [HOURS['2AM']]: { type: Boolean, default: false },
    [HOURS['3AM']]: { type: Boolean, default: false },
    [HOURS['4AM']]: { type: Boolean, default: false },
    [HOURS['5AM']]: { type: Boolean, default: false },
    [HOURS['6AM']]: { type: Boolean, default: false },
    [HOURS['7AM']]: { type: Boolean, default: false },
    [HOURS['8AM']]: { type: Boolean, default: false },
    [HOURS['9AM']]: { type: Boolean, default: false },
    [HOURS['10AM']]: { type: Boolean, default: false },
    [HOURS['11AM']]: { type: Boolean, default: false },
    [HOURS['12PM']]: { type: Boolean, default: false },
    [HOURS['1PM']]: { type: Boolean, default: false },
    [HOURS['2PM']]: { type: Boolean, default: false },
    [HOURS['3PM']]: { type: Boolean, default: false },
    [HOURS['4PM']]: { type: Boolean, default: false },
    [HOURS['5PM']]: { type: Boolean, default: false },
    [HOURS['6PM']]: { type: Boolean, default: false },
    [HOURS['7PM']]: { type: Boolean, default: false },
    [HOURS['8PM']]: { type: Boolean, default: false },
    [HOURS['9PM']]: { type: Boolean, default: false },
    [HOURS['10PM']]: { type: Boolean, default: false },
    [HOURS['11PM']]: { type: Boolean, default: false }
  },
  { _id: false }
);
