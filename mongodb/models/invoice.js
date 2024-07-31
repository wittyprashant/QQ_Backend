import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
}, { _id: false });

const contactSchema = new Schema({
}, { _id: false });

const lineItemSchema = new Schema({
}, { _id: false });

const invoiceSchema = new Schema({
    Type: { type: String, required: true },
    InvoiceID: { type: String, required: true },
    InvoiceNumber: { type: String},
    Reference: { type: String, default: '' },
    Payments: { type: [paymentSchema], default: [] },
    CreditNotes: { type: [Schema.Types.Mixed], default: [] },
    Prepayments: { type: [Schema.Types.Mixed], default: [] },
    Overpayments: { type: [Schema.Types.Mixed], default: [] },
    AmountDue: { type: Number, required: true },
    AmountPaid: { type: Number, required: true },
    AmountCredited: { type: Number, required: true },
    CurrencyRate: { type: Number },
    IsDiscounted: { type: Boolean, required: true },
    HasAttachments: { type: Boolean, required: true },
    InvoiceAddresses: { type: [Schema.Types.Mixed], default: [] },
    HasErrors: { type: Boolean, required: true },
    InvoicePaymentServices: { type: [Schema.Types.Mixed], default: [] },
    Contact: { type: contactSchema, required: true },
    DateString: { type: Date, required: true },
    Date: { type: String, required: true },
    DueDateString: { type: Date, required: true },
    DueDate: { type: String, required: true },
    Status: { type: String, required: true, enum: ['PAID', 'DRAFT', 'AUTHORISED', 'DELETED', 'VOIDED', 'SUBMITTED'] },
    LineAmountTypes: { type: String, required: true, enum: ['Exclusive', 'Inclusive', 'NoTax'] },
    LineItems: { type: [lineItemSchema], default: [] },
    SubTotal: { type: Number, required: true },
    TotalTax: { type: Number, required: true },
    Total: { type: Number, required: true },
    UpdatedDateUTC: { type: String, required: true },
    CurrencyCode: { type: String, required: true },
    FullyPaidOnDate: { type: String, required: false }, 
});

export default mongoose.model('Invoice', invoiceSchema);
