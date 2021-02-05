import mongoose from 'mongoose'
import request from 'supertest'
import app from '../../app'
import { insertVolunteer, resetDb } from '../db-utils'
import { buildVolunteer, buildReference, authLogin } from '../generate'

// agent stores the session when making an auth request
const agent = request.agent(app)

/**
 *
 * @todo: figure out how to mock properly
 * @note: mockImplementationOnce forces the "Volunteer recieves an error requesting photo id upload url" and "Volunteer recieves a photo id upload url" to be run in that order otherwise the tests will fail
 *
 *
 * Unable to change mock implementation from module factory:
 * see https://jestjs.io/docs/en/es6-class-mocks#calling-jestmockdocsenjest-objectjestmockmodulename-factory-options-with-the-module-factory-parameter
 * and  https://github.com/kulshekhar/ts-jest/issues/1088
 *
 */
jest.mock('aws-sdk', () => {
  return {
    S3: jest.fn(() => ({
      getSignedUrlPromise: jest
        .fn()
        .mockImplementationOnce(() => '')
        .mockImplementationOnce(
          () => 'https://photos.s3.us-east-2.amazonaws.com/12345'
        )
    }))
  }
})

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})

// @todo: fix parallel test issues
// @note: parallel test issues occur when cleaning up the db before each run current
//        workaround is to run jest with the '--runInBand' to run the tests serially
beforeEach(async () => {
  await resetDb()
})

test('Volunteer submits a reference', async () => {
  const reference = buildReference()
  const volunteer = buildVolunteer()
  await insertVolunteer(volunteer)
  await authLogin(agent, volunteer)
  await agent
    .post('/api/user/volunteer-approval/reference')
    .send({
      referenceFirstName: reference.firstName,
      referenceLastName: reference.lastName,
      referenceEmail: reference.email
    })
    .expect(200)
})

test('Volunteer deletes a reference', async () => {
  const reference = buildReference()
  const references = [reference]
  const volunteer = buildVolunteer({ references })
  await insertVolunteer(volunteer)
  await authLogin(agent, volunteer)
  await agent
    .post('/api/user/volunteer-approval/reference/delete')
    .send({
      referenceEmail: reference.email
    })
    .expect(200)
})

// @todo: clean up - see note above for jest.mock('aws-sdk')
test('Volunteer recieves an error requesting photo id upload url', async () => {
  const volunteer = buildVolunteer()
  await insertVolunteer(volunteer)
  await authLogin(agent, volunteer)
  const response = await agent
    .get('/api/user/volunteer-approval/photo-url')
    .expect(200)

  const {
    body: { success, message }
  } = response
  const expectedMessage = 'Pre-signed URL error'

  expect(message).toEqual(expectedMessage)
  expect(success).toBeFalsy()
})

// @todo: clean up - see note above for jest.mock('aws-sdk')
test('Volunteer recieves a photo id upload url', async () => {
  const volunteer = buildVolunteer()
  await insertVolunteer(volunteer)
  await authLogin(agent, volunteer)
  const response = await agent
    .get('/api/user/volunteer-approval/photo-url')
    .expect(200)

  const {
    body: { success, message, uploadUrl }
  } = response
  const expectedMessage = 'AWS SDK S3 pre-signed URL generated successfully'

  expect(message).toEqual(expectedMessage)
  expect(success).toBeTruthy()
  expect(uploadUrl).toBeTruthy()
})
