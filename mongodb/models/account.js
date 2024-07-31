import mongoose from 'mongoose';

const Account = new mongoose.Schema({
    name: { type: String, unique: true, trim: true, max: 50, required: [true, 'Role name is required'] },
    permission: { type: String, trim: true, required: [true, 'Permission is required'] },
    action_permission: { type: String, trim: true, required: [true, 'Action permission is required'] },
    is_listing: { type: Number, default: 0, min: [0, 'is_listing cannot be less than 0'] },
    status: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

const AccountSchema = mongoose.model('Account', Account);

export default AccountSchema;
