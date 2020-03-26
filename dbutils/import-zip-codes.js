const mongoose = require('mongoose')
const async = require('async')
const https = require('https')
const csvParse = require('csv-parse')
const cliProgress = require('cli-progress')
const dbconnect = require('./dbconnect')

const ZipCode = require('../models/ZipCode')

dbconnect(mongoose, async function() {
  async.waterfall(
    [
      function(done) {
        const csvUrl =
          'https://raw.githubusercontent.com/UPchieve/zipcode-income/master/median-income-by-zipcode.csv'

        https
          .get(csvUrl, res => {
            res.setEncoding('utf8')

            let resData = ''

            res.on('data', chunk => {
              resData += chunk
            })

            res.on('end', () => {
              return done(null, resData)
            })
          })
          .on('error', err => {
            return done(err)
          })
      },
      function(zipData, done) {
        const zips = []

        const parser = csvParse({
          cast: function(value, context) {
            if (value && !isNaN(value)) {
              return parseInt(value)
            } else {
              return value
            }
          },
          columns: true
        })

        parser.on('readable', () => {
          let zip = parser.read()
          while (zip) {
            // push only valid zip codes
            if (zip.zipcode_label) {
              zips.push(zip)
            }

            zip = parser.read()
          }
        })

        parser.on('end', () => {
          done(null, zips)
        })

        parser.write(zipData)
        parser.end()
      },
      function(zips, done) {
        const progressBar = new cliProgress.SingleBar(
          {},
          cliProgress.Presets.shades_classic
        )

        progressBar.start(zips.length, 0)

        const zipCodeRegex = /ZCTA5 (\d{5})/
        const defaultMedianIncome = undefined

        async.mapSeries(
          zips,
          function(zip, callback) {
            const [, zipCode] = zip.zipcode_label.match(zipCodeRegex)

            const medianIncome = !isNaN(zip.median_income)
              ? zip.median_income
              : defaultMedianIncome

            const newZipCode = new ZipCode({
              zipCode,
              medianIncome
            })

            newZipCode
              .save()
              .catch(e => {
                console.log(e)
              })
              .finally(() => {
                progressBar.increment()
                callback()
              })
          },
          () => {
            progressBar.stop()
            done()
          }
        )
      }
    ],
    function(err) {
      if (err) {
        console.log(err)
      }
      mongoose.disconnect()
    }
  )
})
