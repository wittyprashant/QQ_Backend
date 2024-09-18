import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
    AccountID: { type: String, required: true, unique: true },
    Code: { type: String, required: true },
    Name: { type: String, required: true },
    Status: { type: String, required: true },
    Type: { type: String, required: true },
    TaxType: { type: String },
    Class: { type: String },
    EnablePaymentsToAccount: { type: Boolean },
    ShowInExpenseClaims: { type: Boolean },
    BankAccountNumber: { type: String },
    BankAccountType: { type: String },
    CurrencyCode: { type: String },
    ReportingCode: { type: String },
    ReportingCodeName: { type: String },
    HasAttachments: { type: Boolean },
    UpdatedDateUTC: { type: String },
    AddToWatchlist: { type: Boolean }
}, { timestamps: true });

export default mongoose.model('Account', AccountSchema);
