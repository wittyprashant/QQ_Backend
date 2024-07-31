import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const parseXeroDate = (xeroDateString) => {
    if (!xeroDateString) return null;
    const match = xeroDateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
    if (!match) return null;
    return new Date(parseInt(match[1], 10));
};

// Define the schema for Contact within PurchaseOrder
const ContactSchema = new Schema({
    ContactID: { type: String },
    ContactStatus: { type: String },
    Name: { type: String },
    FirstName: { type: String },
    LastName: { type: String },
    Addresses: { type: Array },
    Phones: { type: Array },
    DefaultCurrency: { type: String },
    HasValidationErrors: { type: Boolean }
});

// Define the schema for LineItem within PurchaseOrder
const LineItemSchema = new Schema({
    Description: { type: String },
    UnitAmount: { type: Number },
    TaxType: { type: String },
    TaxAmount: { type: Number },
    LineAmount: { type: Number },
    Tracking: { type: Array },
    Quantity: { type: Number },
    LineItemID: { type: String }
});

// Define the schema for PurchaseOrder
const PurchaseOrderSchema = new Schema({
    PurchaseOrderID: { type: String, unique: true },
    PurchaseOrderNumber: { type: String },
    DateString: { type: String },
    Date: { type: Date, set: parseXeroDate },
    DeliveryDateString: { type: String },
    DeliveryDate: { type: Date, set: parseXeroDate },
    DeliveryAddress: { type: String },
    AttentionTo: { type: String },
    Telephone: { type: String },
    DeliveryInstructions: { type: String },
    HasErrors: { type: Boolean },
    IsDiscounted: { type: Boolean },
    Reference: { type: String },
    Type: { type: String },
    CurrencyRate: { type: Number },
    CurrencyCode: { type: String },
    Contact: { type: ContactSchema },
    BrandingThemeID: { type: String },
    Status: { type: String },
    LineAmountTypes: { type: String },
    LineItems: { type: [LineItemSchema] },
    SubTotal: { type: Number },
    TotalTax: { type: Number },
    Total: { type: Number },
    UpdatedDateUTC: { type: Date, set: parseXeroDate },
    HasAttachments: { type: Boolean }
},{ timestamps: true });

export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);