import { values } from 'lodash'
import { Document, model, Schema, Types } from 'mongoose'
import { IP_ADDRESS_STATUS } from '../constants'
import { User } from './User'

export interface IpAddress {
  createdAt: Date
  ip: string
  users: (Types.ObjectId | User)[]
  status: IP_ADDRESS_STATUS
}

export type IpAddressDocument = IpAddress & Document

const ipAddressSchema = new Schema({
  createdAt: { type: Date, default: Date.now },

  ip: {
    type: String,
    unique: true,
    required: true
  },

  users: [{ type: Types.ObjectId, ref: 'User' }],

  status: {
    type: String,
    enum: values(IP_ADDRESS_STATUS),
    default: IP_ADDRESS_STATUS.OK
  }
})

const IpAddressModel = model<IpAddressDocument>('IpAddress', ipAddressSchema)

module.exports = IpAddressModel
export default IpAddressModel
