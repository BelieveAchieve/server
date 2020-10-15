import { Document, model, Schema, DocumentQuery } from 'mongoose';

const MEDIUM_INCOME_THRESHOLD = 60000;

export interface ZipCode {
  zipCode: string;
  medianIncome: number;
}

export type ZipCodeDocument = ZipCode & Document;

const zipCodeSchema = new Schema({
  zipCode: {
    type: String,
    unique: true,
    required: true
  },
  medianIncome: Number
});

zipCodeSchema.virtual('isEligible').get(function(): boolean {
  if (!this.medianIncome) return true;

  return this.medianIncome < MEDIUM_INCOME_THRESHOLD;
});

zipCodeSchema.statics.findByZipCode = function(
  zipCode: Partial<ZipCode>,
  cb: (zipCode: ZipCodeDocument) => void
): DocumentQuery<ZipCode, ZipCodeDocument> {
  return this.findOne({ zipCode }, cb);
};

const ZipCodeModel = model<ZipCodeDocument>('ZipCode', zipCodeSchema);

module.exports = ZipCodeModel;
export default ZipCodeModel;
