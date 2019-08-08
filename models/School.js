const mongoose = require('mongoose')
const validator = require('validator')

const schoolSchema = new mongoose.Schema({
  // 8-digit unique identifier
  upchieveId: {
    type: String,
    unique: true,
    required: true,
    match: /^[0-9]{8}$/
  },

  // manually entered data
  nameStored: String,
  districtNameStored: String,
  stateStored: {
    type: String,
    // http://regexlib.com/REDetails.aspx?regexp_id=2176
    match: /^((A[LKSZR])|(C[AOT])|(D[EC])|(F[ML])|(G[AU])|(HI)|(I[DLNA])|(K[SY])|(LA)|(M[EHDAINSOT])|(N[EVHJMYCD])|(MP)|(O[HKR])|(P[WAR])|(RI)|(S[CD])|(T[NX])|(UT)|(V[TIA])|(W[AVIY]))$/
  },

  // email addresses to notify for approval
  approvalNotifyEmails: [{
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (v) {
          return validator.isEmail(v)
        },
        message: '{VALUE} is not a valid email'
      }
    }
  }],

  // NCES variable names
  SCHOOL_YEAR: String,
  FIPST: Number,
  STATENAME: String,
  ST: String,
  SCH_NAME: String,
  LEA_NAME: String,
  STATE_AGENCY_NO: Number,
  UNION: String,
  ST_LEAID: String,
  LEAID: Number,
  ST_SCHID: String,
  NCESSCH: Number,
  SCHID: Number,
  MSTREET1: String,
  MSTREET2: String,
  MSTREET3: String,
  MCITY: String,
  MSTATE: String,
  MZIP: Number,
  MZIP4: Number,
  LSTREET1: String,
  LSTREET2: String,
  LSTREET3: String,
  LCITY: String,
  LSTATE: String,
  LZIP: Number,
  LZIP4: String,
  PHONE: String,
  WEBSITE: String,
  SY_STATUS: Number,
  SY_STATUS_TEXT: String,
  UPDATED_STATUS: Number,
  UPDATED_STATUS_TEXT: String,
  EFFECTIVE_DATE: String,
  SCH_TYPE: Number,
  SCH_TYPE_TEXT: String,
  RECON_STATUS: String,
  OUT_OF_STATE_FLAG: String,
  CHARTER_TEXT: String,
  CHARTAUTH1: String,
  CHARTAUTHN1: String,
  CHARTAUTH2: String,
  CHARTAUTHN2: String,
  NOGRADES: String,
  G_PK_OFFERED: String,
  G_KG_OFFERED: String,
  G_1_OFFERED: String,
  G_2_OFFERED: String,
  G_3_OFFERED: String,
  G_4_OFFERED: String,
  G_5_OFFERED: String,
  G_6_OFFERED: String,
  G_7_OFFERED: String,
  G_8_OFFERED: String,
  G_9_OFFERED: String,
  G_10_OFFERED: String,
  G_11_OFFERED: String,
  G_12_OFFERED: String,
  G_13_OFFERED: String,
  G_UG_OFFERED: String,
  G_AE_OFFERED: String,
  GSLO: Number,
  GSHI: Number,
  LEVEL: String,
  IGOFFERED: String
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
})

schoolSchema.index({ nameStored: 'text', SCH_NAME: 'text' })

// virtual properties that can reference either stored information or NCES variables
schoolSchema.virtual('name').get(function () {
  return this.nameStored || this.SCH_NAME
}).set(function (value) {
  this.nameStored = value
})

schoolSchema.virtual('districtName').get(function () {
  return this.districtNameStored || this.LEA_NAME
})

schoolSchema.virtual('state').get(function () {
  return this.stateStored || this.ST
})

schoolSchema.methods.findByUpchieveId = function (id, cb) {
  this.findOne({ upchieveId: id }, cb)
}

module.exports = mongoose.model('School', schoolSchema)
