import { volunteerPartnerManifests } from '../../partnerManifests'

test('Example3 volunteer has all data', () => {
  expect(volunteerPartnerManifests['example3']['name']).toEqual('Example - Email Requirement & Math Only')
  expect(volunteerPartnerManifests['example3']['requiredEmailDomains']).toHaveLength(2)
  expect(volunteerPartnerManifests['example3']['requiredEmailDomains'][0]).toEqual('example.org')
})
