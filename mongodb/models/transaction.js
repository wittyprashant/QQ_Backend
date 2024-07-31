import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const BankAccountSchema = new Schema({
    AccountID: String,
    Code: String,
    Name: String
});

const roleSchema = new Schema({
    name: { type: String},
    permission: { type: String},
    action_permission: { type: String},
    is_listing: { type: Number},
    status: { type: Boolean},
    is_deleted: { type: Boolean}
  }, { timestamps: true });

const UserSchema = new mongoose.Schema({
    first_name: { type: String},
    last_name: { type: String},
    email: { type: String},
    password: { type: String},
    role: { type: roleSchema },
    status: { type: Boolean},
    is_deleted: { type: Boolean } }, 
    { timestamps: true }
);

const ContactSchema = new Schema({
    ContactID: String,
    Name: String,
    Addresses: Array,
    Phones: Array,
    ContactGroups: Array,
    ContactPersons: Array,
    HasValidationErrors: Boolean
});

const BankTransactionSchema = new Schema({
    BankTransactionID: { type: String, required: true },
    BankAccount: BankAccountSchema,
    Type: String,
    Reference: String,
    IsReconciled: Boolean,
    HasAttachments: Boolean,
    Contact: ContactSchema,
    User: UserSchema,
    DateString: String,
    Date: Date,
    Status: String,
    LineAmountTypes: String,
    LineItems: Array,
    SubTotal: Number,
    TotalTax: Number,
    Total: Number,
    UpdatedDateUTC: Date,
    CurrencyCode: String
}, {
    timestamps: true
});

const Transaction = mongoose.model('BankTransaction', BankTransactionSchema);
export default Transaction;
