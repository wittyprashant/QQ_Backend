import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Contact Schema
const ContactSchema = new Schema({
  ContactID: { type: String, required: true },
  Name: { type: String, required: true },
  Addresses: { type: Array, default: [] },
  Phones: { type: Array, default: [] },
  ContactGroups: { type: Array, default: [] },
  ContactPersons: { type: Array, default: [] },
  HasValidationErrors: { type: Boolean, default: false }
});

// Invoice Schema
const InvoiceSchema = new Schema({
  Type: { type: String, required: true },
  InvoiceID: { type: String, required: true },
  InvoiceNumber: { type: String, default: '' },
  Payments: { type: Array, default: [] },
  CreditNotes: { type: Array, default: [] },
  Prepayments: { type: Array, default: [] },
  Overpayments: { type: Array, default: [] },
  IsDiscounted: { type: Boolean, default: false },
  InvoiceAddresses: { type: Array, default: [] },
  HasErrors: { type: Boolean, default: false },
  InvoicePaymentServices: { type: Array, default: [] },
  Contact: { type: ContactSchema, required: true },
  LineItems: { type: Array, default: [] },
  CurrencyCode: { type: String, default: 'AUD' }
});

// Account Schema
const AccountSchema = new Schema({
  AccountID: { type: String, required: true },
  Code: { type: String, required: true }
});

// Payment Schema
const PaymentSchema = new Schema({
  PaymentID: { type: String, required: true },
  Date: { type: Date, required: true },
  BankAmount: { type: Number, required: true },
  Amount: { type: Number, required: true },
  Reference: { type: String, default: '' },
  CurrencyRate: { type: Number, default: 0 },
  PaymentType: { type: String, required: true },
  Status: { type: String, required: true },
  UpdatedDateUTC: { type: Date, required: true },
  HasAccount: { type: Boolean, default: true },
  IsReconciled: { type: Boolean, default: true },
  Account: { type: AccountSchema, required: true },
  Invoice: { type: InvoiceSchema, required: true },
  HasValidationErrors: { type: Boolean, default: false }
},{ timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
