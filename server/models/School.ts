import { Document, model, Schema, DocumentQuery, Types } from 'mongoose'
import validator from 'validator'

export interface School {
  _id: Types.ObjectId
  upchieveId: string
  nameStored: string
  districtNameStored: string
  cityNameStored: string
  stateStored: string
  isApproved: boolean
  createdAt: Date
  approvedNotifyEmails: {
    email: string
    addedAt: Date
  }[]
  SCHOOL_YEAR?: string
  FIPST?: number
  STATENAME?: string
  ST?: string
  SCH_NAME?: string
  LEA_NAME?: string
  STATE_AGENCY_NO?: number
  UNION?: string
  ST_LEAID?: string
  LEAID?: number
  ST_SCHID?: string
  NCESSCH?: number
  SCHID?: number
  MSTREET1?: string
  MSTREET2?: string
  MSTREET3?: string
  MCITY?: string
  MSTATE?: string
  MZIP?: number
  MZIP4?: number
  LSTREET1?: string
  LSTREET2?: string
  LSTREET3?: string
  LCITY?: string
  LSTATE?: string
  LZIP?: number
  LZIP4?: string
  PHONE?: string
  WEBSITE?: string
  SY_STATUS?: number
  SY_STATUS_TEXT?: string
  UPDATED_STATUS?: number
  UPDATED_STATUS_TEXT?: string
  EFFECTIVE_DATE?: string
  SCH_TYPE?: number
  SCH_TYPE_TEXT?: string
  RECON_STATUS?: string
  OUT_OF_STATE_FLAG?: string
  CHARTER_TEXT?: string
  CHARTAUTH1?: string
  CHARTAUTHN1?: string
  CHARTAUTH2?: string
  CHARTAUTHN2?: string
  NOGRADES?: string
  G_PK_OFFERED?: string
  G_KG_OFFERED?: string
  G_1_OFFERED?: string
  G_2_OFFERED?: string
  G_3_OFFERED?: string
  G_4_OFFERED?: string
  G_5_OFFERED?: string
  G_6_OFFERED?: string
  G_7_OFFERED?: string
  G_8_OFFERED?: string
  G_9_OFFERED?: string
  G_10_OFFERED?: string
  G_11_OFFERED?: string
  G_12_OFFERED?: string
  G_13_OFFERED?: string
  G_UG_OFFERED?: string
  G_AE_OFFERED?: string
  // school may offer PK or KG as well as high school
  GSLO?: string
  GSHI?: number
  LEVEL?: string
  IGOFFERED?: string
}

export type SchoolDocument = School & Document

const schoolSchema = new Schema(
  {
    // 8-digit unique identifier
    upchieveId: {
      type: String,
      unique: true,
      required: true,
      match: /^[0-9]{8}$/
    },

    // fields allowing a school to be entered manually if not in NCES database
    nameStored: String,
    districtNameStored: String,
    cityNameStored: String,
    stateStored: {
      type: String,
      // http://regexlib.com/REDetails.aspx?regexp_id=2176
      match: /^((A[LKSZR])|(C[AOT])|(D[EC])|(F[ML])|(G[AU])|(HI)|(I[DLNA])|(K[SY])|(LA)|(M[EHDAINSOT])|(N[EVHJMYCD])|(MP)|(O[HKR])|(P[WAR])|(RI)|(S[CD])|(T[NX])|(UT)|(V[TIA])|(W[AVIY]))$/
    },

    // is this school eligibile for UPchieve?
    isApproved: {
      type: Boolean,
      default: false
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    // email addresses to notify for approval
    approvalNotifyEmails: [
      {
        email: {
          type: String,
          lowercase: true,
          validate: {
            validator: function(v): boolean {
              return validator.isEmail(v)
            },
            message: '{VALUE} is not a valid email'
          }
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

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
    // school may offer PK or KG as well as high school
    GSLO: String,
    GSHI: Number,
    LEVEL: String,
    IGOFFERED: String
  },
  {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
)

schoolSchema.index({ nameStored: 'text', SCH_NAME: 'text' })

// virtual properties that can reference either stored information or NCES variables
schoolSchema
  .virtual('name')
  .get(function() {
    return this.nameStored || this.SCH_NAME
  })
  .set(function(value) {
    this.nameStored = value
  })

schoolSchema
  .virtual('districtName')
  .get(function() {
    return this.districtNameStored || this.LEA_NAME
  })
  .set(function(value) {
    this.districtNameStored = value
  })

schoolSchema
  .virtual('city')
  .get(function() {
    return this.cityNameStored || this.LCITY
  })
  .set(function(value) {
    this.cityNameStored = value
  })

schoolSchema
  .virtual('state')
  .get(function() {
    return this.stateStored || this.ST
  })
  .set(function(value) {
    this.stateStored = value
  })

// Virtual property giving a searchable name including the school's city
// name first
schoolSchema.virtual('searchableName').get(function() {
  return `${this.city} ${this.name}`
})

// Users registered with this school
schoolSchema.virtual('studentUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'approvedHighschool'
})

schoolSchema.statics.findByUpchieveId = function(
  id: string,
  cb: (err: Error, school: SchoolDocument) => void
): DocumentQuery<School, SchoolDocument> {
  return this.findOne({ upchieveId: id }, cb)
}

const SchoolModel = model<SchoolDocument>('School', schoolSchema)

module.exports = SchoolModel
export default SchoolModel
