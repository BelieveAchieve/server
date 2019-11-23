/*
 * This file is a placeholder for future unit tests, since there is no logic involved. 
 */

const test = require('ava')
const School = require('../../models/School')

//Place holder for school object.
const school = new School({

  SCHOOL_YEAR: 'SCHOOL_YEAR',
  districtName: "districtName",
  FIPST: 0,
  STATENAME: 'STATENAME',
  nameStored: "nameStored",
  ST: 'ST',
  SCH_NAME: 'SCH_NAME',
  LEA_NAME: 'LEA_NAME',
  STATE_AGENCY_NO: 0,
  UNION: 'UNION',
  ST_LEAID: 'ST_LEAID',
  LEAID: 0,
  ST_SCHID: 'ST_SCHID',
  NCESSCH: 0,
  SCHID: 0,
  MSTREET1: 'MSTREET1',
  MSTREET2: 'MSTREET2',
  MSTREET3: 'MSTREET3',
  MCITY: 'MCITY',
  MSTATE: 'MSTATE',
  MZIP: 0,
  MZIP4: 0,
  LSTREET1: 'LSTREET1',
  LSTREET2: 'LSTREET2',
  LSTREET3: 'LSTREET3',
  LCITY: 'LCITY',
  LSTATE: 'LSTATE',
  LZIP: 0,
  LZIP4: 'LZIP4',
  PHONE: 'PHONE',
  WEBSITE: 'WEBSITE',
  SY_STATUS: 'SY_STATUS',
  SY_STATUS_TEXT: 'SY_STATUS_TEXT',
  UPDATED_STATUS: 0,
  UPDATED_STATUS_TEXT: 'UPDATED_STATUS_TEXT',
  EFFECTIVE_DATE: 'EFFECTIVE_DATE',
  SCH_TYPE: 0,
  SCH_TYPE_TEXT: 'SCH_TYPE_TEXT',
  RECON_STATUS: 'RECON_STATUS',
  OUT_OF_STATE_FLAG: 'OUT_OF_STATE_FLAG',
  CHARTER_TEXT: 'CHARTER_TEXT',
  CHARTAUTH1: 'CHARTAUTH1',
  CHARTAUTHN1: 'CHARTAUTHN1',
  CHARTAUTH2: 'CHARTAUTH2',
  CHARTAUTHN2: 'CHARTAUTHN2',
  NOGRADES: 'NOGRADES',
  G_PK_OFFERED: 'G_PK_OFFERED',
  G_KG_OFFERED: 'G_KG_OFFERED',
  G_1_OFFERED: 'G_1_OFFERED',
  G_2_OFFERED: 'G_2_OFFERED',
  G_3_OFFERED: 'G_3_OFFERED',
  G_4_OFFERED: 'G_4_OFFERED',
  G_5_OFFERED: 'G_5_OFFERED',
  G_6_OFFERED: 'G_6_OFFERED',
  G_7_OFFERED: 'G_7_OFFERED',
  G_8_OFFERED: 'G_8_OFFERED',
  G_9_OFFERED: 'G_9_OFFERED',
  G_10_OFFERED: 'G_10_OFFERED',
  G_11_OFFERED: 'G_11_OFFERED',
  G_12_OFFERED: 'G_12_OFFERED',
  G_13_OFFERED: 'G_13_OFFERED',
  G_UG_OFFERED: 'G_UG_OFFERED',
  G_AE_OFFERED: 'G_AE_OFFERED',
  GSLO: 0,
  GSHI: 0,
  LEVEL: 'LEVEL',
  IGOFFERED: 'IGOFFERED'
})

//Placeholder
test('Test creation of School scheme object', t => {
	school.nameStored = "newname"
	let temp = school.nameStored
	t.is(temp, "newname")
}) 

test('Check districtName setters/getterss', t => {
	school.districtName = "newname"
	let temp = school.districtName
	t.is(temp, "newname")
}) 

test('Check state setters/getterss', t => {
	school.state = "newname"
	let temp = school.state
	t.is(temp, "newname")
}) 

