/* This script clears high school data that are imported from NCES and updates it to
 * the most recent version. Manually entered schools are kept by default, and approval
 * status is maintained.
 */

const mongoose = require('mongoose')
const async = require('async')
const https = require('https')
const JSZip = require('jszip')
const csvParse = require('csv-parse')
// for generating unique upchieveId
const crypto = require('crypto')

const dbconnect = require('./dbconnect')

const School = require('../models/School')

function addNewSchool (school, done) {
  // create unique upchieveId
  const hash = crypto.createHash('sha1')
  hash.update(school.ST_SCHID)
  let upchieveId = (hash.digest().readUInt32BE(0) % 100000000)
    .toString()
    .padStart(8, '0')

  async.doUntil(function (callback) {
    const newSchool = new School({
      upchieveId: upchieveId
    })

    // populate fields
    Object.keys(school).forEach((key) => {
      newSchool[key] = school[key]
    })

    newSchool.save((err) => {
      if (err) {
        console.log(err)
        if (err.code !== 11000) {
          return callback(err)
        }

        // duplicate key, increment the ID number
        upchieveId = ((parseInt(upchieveId) + 1) % 100000000)
          .toString()
          .padStart(8, '0')
        callback(null, false)
      } else {
        console.log(`New school record ${upchieveId} (${newSchool.SCH_NAME})`)
        callback(null, true)
      }
    })
  }, function (isUnique) {
    return isUnique
  }, done)
}

dbconnect(mongoose, function () {
  const ZIP_MIME_REGEX = /^(application\/(zip|x-zip|x-zip-compressed|octet-stream|(x-compress(ed)?))|multipart\/x-zip)$/
  const CSV_MIME_REGEX = /^(text\/(comma-separated-values|csv|anytext)|application\/(csv|excel|vnd\.ms-?excel))$/

  async.waterfall([
    // retrieve the data
    function (done) {
      // get the NCES URL from the first user argument
      const url = process.argv[2]
      if (!url) {
        console.error('This script needs a valid URL to import data.')
        return done(new Error('missing URL argument'))
      }

      https.get(url, res => {
        // get the data from the HTTP response
        console.log('Getting data from ' + url)
        const contentType = res.headers['content-type']

        const isZip = ZIP_MIME_REGEX.test(contentType)
        const isCsv = CSV_MIME_REGEX.test(contentType)

        if (res.statusCode !== 200) {
          console.error(`Request for data file failed: status code ${res.statusCode}`)
          return done(res)
        } else if (!isZip && !isCsv) {
          console.error(`Unsupported MIME type ${contentType}`)
          return done(res)
        }

        if (isZip) {
          let data = []
          let dataLength = 0

          res.on('data', (chunk) => {
            data.push(chunk)
            dataLength += chunk.length
          })

          res.on('end', () => {
            const buf = Buffer.concat(data)

            return done(null, 'zip', buf, dataLength)
          })
        } else if (isCsv) {
          res.setEncoding('utf8')

          let data = ''

          res.on('data', (chunk) => { data += chunk })

          res.on('end', () => {
            return done(null, 'csv', data, data.length)
          })
        }
      }).on('error', (err) => {
        return done(err)
      })
    },
    // unzip the file
    function (format, data, dataLength, done) {
      if (!['csv', 'zip'].includes(format)) {
        return done(new Error(`unsupported file format: ${format}`))
      }

      if (format === 'csv') {
        // skip to CSV parser
        return done(null, data, dataLength)
      } else if (format === 'zip') {
        console.log('Extracting zip file')
        JSZip.loadAsync(data)
          .then((zip) => {
            let foundCsv = false
            zip.forEach((relPath, file) => {
              if (!foundCsv && relPath.endsWith('.csv')) {
                foundCsv = true
                file.async('string').then((csvString) => {
                  return done(null, csvString, csvString.length)
                }).catch(done)
              }
            })
            if (!foundCsv) {
              console.error('No CSV file found in ZIP archive.')
              return done(new Error('no CSV file found'))
            }
          }).catch(done)
      }
    },
    // parse the CSV
    function (data, dataLength, done) {
      console.log('Parsing CSV')
      const parser = csvParse({
        cast: function (value, context) {
          if (value && !isNaN(value)) {
            return parseInt(value)
          } else {
            return value
          }
        },
        columns: true
      })

      const schools = []

      parser.on('readable', () => {
        let school = parser.read()
        while (school) {
          // push only schools offering any of grades 9-12
          if (
            school.G_9_OFFERED === 'Yes' ||
            school.G_10_OFFERED === 'Yes' ||
            school.G_11_OFFERED === 'Yes' ||
            school.G_12_OFFERED === 'Yes') {
            schools.push(school)
          }

          school = parser.read()
        }
      })

      parser.on('error', done)

      parser.on('end', () => {
        done(null, schools)
      })

      parser.write(data)
      parser.end()
    },
    // clear old NCES data entries
    function (schools, done) {
      console.log('Clearing old schools')
      School.find({
        ST_SCHID: { $exists: true }
      }, (err, results) => {
        if (err) {
          return done(err)
        }

        // ST_SCHID => school
        // this object is created to improve time performance
        // of the next code
        const schoolObj = {}
        schools.forEach((school) => {
          schoolObj[school.ST_SCHID] = school
        })

        async.map(results, (result, callback) => {
          // if this result is not in the file
          if (!schoolObj[result.ST_SCHID]) {
            if (result.nameStored) {
              console.log(
                `Warning: School "${result.nameStored}" is no longer in the data file ` +
                `but will not be deleted because it was also entered manually`
              )
              callback(null)
            } else {
              School.deleteOne({
                ST_SCHID: result.ST_SCHID
              },
              (err) => {
                callback(err)
              })
            }
          } else {
            callback(null)
          }
        }, (err) => {
          if (err) {
            done(err)
          } else {
            done(null, schools)
          }
        })
      })
    },
    // add schools to database
    function (schools, done) {
      console.log('Updating records')
      let nSchoolsUpdated = 0

      async.mapSeries(schools, function (school, callback) {
        console.log(`Updating record ${nSchoolsUpdated + 1} of ${schools.length}`)
        School.find({
          ST_SCHID: school.ST_SCHID
        }, function (err, results) {
          if (err) {
            return callback(err)
          }

          if (results && results.length) {
            // update existing NCES fields
            const data = results[0]

            Object.keys(school).forEach((key) => {
              data[key] = school[key]
            })

            data.save((err) => {
              nSchoolsUpdated++
              callback(err) 
            })
          } else {
            addNewSchool(school, (err) => {
              nSchoolsUpdated++
              callback(err)
            })
          }
        })
      }, done)
    }
  ],
  function (err) {
    if (err) {
      console.log(err)
    }
    mongoose.disconnect()
  })
})
