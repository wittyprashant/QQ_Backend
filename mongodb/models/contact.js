import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    AddressType: String,
    AddressLine1: String,
    AddressLine2: String,
    AddressLine3: String,
    AddressLine4: String,
    City: String,
    Region: String,
    PostalCode: String,
    Country: String,
    AttentionTo: String,
}, { _id: true });

const phoneSchema = new Schema({
    PhoneType: String,
    PhoneNumber: String,
    PhoneAreaCode: String,
    PhoneCountryCode: String,
}, { _id: true });


const balanceSchema  = new Schema({
    Outstanding: Number,
    Overdue: Number,
}, { _id: true });

const contactSchema = new Schema({
  ContactID: { type: String, required: true, unique: true },
  ContactStatus: String,
  Name: String,
  FirstName: String,
  LastName: String,
  EmailAddress: String,
  BankAccountDetails: String,
  Addresses: [addressSchema],
  Phones: [phoneSchema],
  UpdatedDateUTC: Date,
  ContactGroups: [String],
  IsSupplier: Boolean,
  IsCustomer: Boolean,
  ContactPersons: [String],
  HasAttachments: Boolean,
  HasValidationErrors: Boolean,
  Balances: {
    AccountsReceivable: balanceSchema,
    AccountsPayable: balanceSchema,
  },
  DefaultCurrency: String
}, {
    timestamps: true
});

export default mongoose.model('Contact', contactSchema);