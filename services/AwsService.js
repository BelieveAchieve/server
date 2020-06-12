const AWS = require('aws-sdk')
const Sentry = require('@sentry/node')
const config = require('../config')

const s3 = new AWS.S3({
  accessKeyId: config.awsS3.accessKeyId,
  secretAccessKey: config.awsS3.secretAccessKey,
  region: config.awsS3.region,
  signatureVersion: 'v4'
})

// @todo: typescript
module.exports = {
  getPhotoIdUploadUrl: async ({ photoIdS3Key }) => {
    const signedUrlParams = {
      Bucket: config.awsS3.photoIdBucket,
      Key: photoIdS3Key,
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
  }
}
