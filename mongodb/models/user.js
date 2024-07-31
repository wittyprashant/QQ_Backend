import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const roleSchema = new Schema({
    name: { type: String, required: true },
    permission: { type: String, required: true },
    action_permission: { type: String, required: true },
    is_listing: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }
  }, { timestamps: true });

const User = new mongoose.Schema({
    globalUserID: { type: String, unique: true },
    userID: { type: String },
    first_name: { type: String, max: 25 },
    firstName: { type: String },
    last_name: { type: String, max: 25 },
    lastName: { type: String },
    email: { type: String, unique: true, lowercase: true, trim: true },
    emailAddress: { type: String },
    password: { type: String, select: false, max: 8 },
    role: { type: roleSchema },
    status: { type: Boolean, default: true },
    updatedDateUTC: { type: String },
    isSubscriber: { type: Boolean },
    organisationRole: { type: String },
    is_deleted: { type: Boolean, default: false } }, 
    { timestamps: true }
);

const UserSchema = mongoose.model('User', User);

export default UserSchema;
