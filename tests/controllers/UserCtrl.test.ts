import { buildVolunteer } from '../generate';
import UserCtrl from '../../controllers/UserCtrl';
import {
  flexibleHoursSelected,
  noHoursSelected,
  allHoursSelected
} from '../mocks/volunteer-availability';

describe('calculateElapsedAvailability', () => {
  test('Should not calculate elapsed availability for volunteers who are not onboarded', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-06T00:52:59.538-05:00';
    const newModifiedDate = '2020-02-09T12:40:00.000-05:00';
    const angelou = buildVolunteer({
      availability: flexibleHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: true,
      isOnboarded: false
    });

    const result = UserCtrl.calculateElapsedAvailability(
      angelou,
      newModifiedDate
    );
    const expectedElapsedAvailability = 0;
    expect(result).toBe(expectedElapsedAvailability);
  });

  test('Should not calculate elapsed availability for volunteers who are not approved', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-06T00:52:59.538-05:00';
    const newModifiedDate = '2020-02-09T12:40:00.000-05:00';
    const plath = buildVolunteer({
      availability: flexibleHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: false,
      isOnboarded: true
    });

    const result = UserCtrl.calculateElapsedAvailability(
      plath,
      newModifiedDate
    );
    const expectedElapsedAvailability = 0;
    expect(result).toBe(expectedElapsedAvailability);
  });

  test('Elapsed availability over 3 days with no hours available', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-06T12:52:59.538-05:00';
    const newModifiedDate = '2020-02-09T13:40:00.000-05:00';
    const whitman = buildVolunteer({
      availability: noHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: true,
      isOnboarded: true
    });

    const result = UserCtrl.calculateElapsedAvailability(
      whitman,
      newModifiedDate
    );
    const expectedElapsedAvailability = 0;
    expect(result).toBe(expectedElapsedAvailability);
  });

  test('Elapsed availability over 3 days with all hours available and 7 hours out of range', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-06T00:52:59.538-05:00';
    const newModifiedDate = '2020-02-09T19:40:00.000-05:00';
    const tennyson = buildVolunteer({
      availability: allHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: true,
      isOnboarded: true
    });

    const result = UserCtrl.calculateElapsedAvailability(
      tennyson,
      newModifiedDate
    );
    const expectedElapsedAvailability = 90;
    expect(result).toBe(expectedElapsedAvailability);
  });

  test('Elapsed availability over 3 days with flexible hours available', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-06T00:52:59.538-05:00';
    const newModifiedDate = '2020-02-09T12:40:00.000-05:00';
    const emerson = buildVolunteer({
      availability: flexibleHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: true,
      isOnboarded: true
    });

    const result = UserCtrl.calculateElapsedAvailability(
      emerson,
      newModifiedDate
    );
    const expectedElapsedAvailability = 16;
    expect(result).toBe(expectedElapsedAvailability);
  });

  /** 
   * flexibleHoursSelected mapped:
   { Sunday: 3,
    Monday: 6,
    Tuesday: 6,
    Wednesday: 5,
    Thursday: 3,
    Friday: 6,
    Saturday: 5 }
  **/
  test('Elapsed availability over 23 days with flexible hours available', () => {
    // EST Time Zone for dates
    const lastModifiedDate = '2020-02-02T05:21:39.538-05:00';
    const newModifiedDate = '2020-02-25T16:20:42.000-05:00';
    const poe = buildVolunteer({
      availability: flexibleHoursSelected,
      availabilityLastModifiedAt: lastModifiedDate,
      isApproved: true,
      isOnboarded: true
    });

    const result = UserCtrl.calculateElapsedAvailability(poe, newModifiedDate);
    const expectedElapsedAvailability = 114;
    expect(result).toBe(expectedElapsedAvailability);
  });
});
