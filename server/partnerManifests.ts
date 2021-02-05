import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import config from './config'

let volunteerManifestsYaml
let studentManifestsYaml

export let volunteerPartnerManifests
export let studentPartnerManifests

if (
  process.env.SUBWAY_VOLUNTEER_PARTNER_MANIFESTS === '' ||
  process.env.SUBWAY_VOLUNTEER_PARTNER_MANIFESTS === undefined
) {
  const volunteerManifestsPath = path.join(
    __dirname,
    config.volunteerPartnerManifestPath
  )
  volunteerManifestsYaml = fs.readFileSync(volunteerManifestsPath, 'utf8')
  volunteerPartnerManifests = YAML.parse(volunteerManifestsYaml)
} else {
  volunteerManifestsYaml = process.env.SUBWAY_VOLUNTEER_PARTNER_MANIFESTS
  volunteerPartnerManifests = YAML.parse(volunteerManifestsYaml)
}

if (
  process.env.SUBWAY_STUDENT_PARTNER_MANIFESTS === '' ||
  process.env.SUBWAY_VOLUNTEER_PARTNER_MANIFESTS === undefined
) {
  const studentManifestsPath = path.join(
    __dirname,
    config.studentPartnerManifestPath
  )
  studentManifestsYaml = fs.readFileSync(studentManifestsPath, 'utf8')
  studentPartnerManifests = YAML.parse(studentManifestsYaml)
} else {
  studentManifestsYaml = process.env.SUBWAY_STUDENT_PARTNER_MANIFESTS
  studentPartnerManifests = YAML.parse(studentManifestsYaml)
}
