import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    PaymentID: { type: String, required: true },
    Date: { type: String, required: true },
    Amount: { type: Number, required: true },
    Reference: { type: String },
    HasAccount: { type: Boolean, required: true },
    HasValidationErrors: { type: Boolean, required: true }
}, { _id: false });


const creditNoteSchema = new Schema({
    CreditNoteID: { type: String, required: true },
    CreditNoteNumber: { type: String },
    AppliedAmount: { type: Number, required: true },
    Date: { type: String, required: true },
    Total: { type: Number, required: true }
}, { _id: false });


const contactSchema = new Schema({
    ContactID: { type: String, required: true },
    Name: { type: String, required: true },
    Addresses: { type: [Schema.Types.Mixed], default: [] },
    Phones: { type: [Schema.Types.Mixed], default: [] },
    ContactGroups: { type: [Schema.Types.Mixed], default: [] },
    ContactPersons: { type: [Schema.Types.Mixed], default: [] },
    HasValidationErrors: { type: Boolean, required: true }
}, { _id: false });

const invoiceSchema = new Schema({
    Type: { type: String, required: true },
    InvoiceID: { type: String, required: true },
    InvoiceNumber: { type: String },
    Reference: { type: String, default: '' },
    Payments: { type: [paymentSchema], default: [] },
    CreditNotes: { type: [creditNoteSchema], default: [] },
    Prepayments: { type: [Schema.Types.Mixed], default: [] },
    Overpayments: { type: [Schema.Types.Mixed], default: [] },
    AmountDue: { type: Number, required: true },
    AmountPaid: { type: Number, required: true },
    AmountCredited: { type: Number, required: true },
    IsDiscounted: { type: Boolean, required: true },
    HasAttachments: { type: Boolean, required: true },
    InvoiceAddresses: { type: [Schema.Types.Mixed], default: [] },
    HasErrors: { type: Boolean, required: true },
    InvoicePaymentServices: { type: [Schema.Types.Mixed], default: [] },
    Contact: { type: contactSchema, required: true },
    DateString: { type: String, required: true },
    Date: { type: String, required: true },
    DueDateString: { type: String, required: true },
    DueDate: { type: String, required: true },
    Status: { type: String, required: true, enum: ['PAID', 'DRAFT', 'AUTHORISED', 'DELETED', 'VOIDED', 'SUBMITTED'] },
    LineAmountTypes: { type: String, required: true, enum: ['Exclusive', 'Inclusive', 'NoTax'] },
    LineItems: { type: [Schema.Types.Mixed], default: [] },
    SubTotal: { type: Number, required: true },
    TotalTax: { type: Number, required: true },
    Total: { type: Number, required: true },
    UpdatedDateUTC: { type: String, required: true },
    CurrencyCode: { type: String, required: true },
    FullyPaidOnDate: { type: String }
});

export default mongoose.model('Invoice', invoiceSchema);
