const AWS = require('aws-sdk')
const Sentry = require('@sentry/node')
const config = require('../config')

const s3 = new AWS.S3({
  accessKeyId: config.awsS3.accessKeyId,
  secretAccessKey: config.awsS3.secretAccessKey,
  region: config.awsS3.region,
  signatureVersion: 'v4'
})

const getObject = async ({ bucket, s3Key }) => {
  const signedUrlParams = {
    Bucket: config.awsS3[bucket],
    Key: s3Key
  }

  try {
    const objectUrl = await s3.getSignedUrlPromise(
      'getObject',
      signedUrlParams
    )
    return objectUrl
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}

module.exports = {
  getSessionPhotoUploadUrl: async sessionPhotoS3Key => {
    const signedUrlParams = {
      Bucket: config.awsS3.sessionPhotoBucket,
      Key: sessionPhotoS3Key,
      Expires: 60 * 60, // link expiration
      ACL: 'bucket-owner-full-control'
    }

    try {
      const uploadUrl = await s3.getSignedUrlPromise(
        'putObject',
        signedUrlParams
      )
      return uploadUrl
    } catch (error) {
      Sentry.captureException(error)
      return null
    }
  },

  getObject,

  getObjects: async ({ bucket, s3Keys }) => {
    const urls = []

    for (const s3Key of s3Keys) {
      urls.push(getObject({ bucket, s3Key }))
    }

    return Promise.all(urls)
  }
}