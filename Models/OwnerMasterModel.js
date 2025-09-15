const mongoose = require("mongoose");

const ownerMasterSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Personal Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      required: false,
    },
    aadharNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    panNumber: {
      type: String,
      trim: true,
      required: false,
    },
    // Address Information
    address: {
      type: String,
      trim: true,
      required: true,
    },
    city: {
      type: String,
      trim: true,
      required: true,
    },
    state: {
      type: String,
      trim: true,
      required: true,
    },
    pincode: {
      type: String,
      trim: true,
      required: true,
    },
    // Business Information
    companyName: {
      type: String,
      trim: true,
      required: false,
    },
    businessType: {
      type: String,
      enum: ['Individual', 'Company', 'Partnership', 'LLP'],
      default: 'Individual',
    },
    gstNumber: {
      type: String,
      trim: true,
      required: false,
    },
    // Banking Information
    bankAccountNumber: {
      type: String,
      trim: true,
      required: false,
    },
    ifscCode: {
      type: String,
      trim: true,
      required: false,
    },
    bankName: {
      type: String,
      trim: true,
      required: false,
    },
    role: {
      type: String,
      default: "Owner",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: false,
    },
    // Trial period fields
    trialStartDate: {
      type: Date,
      default: Date.now,
    },
    trialEndDate: {
      type: Date,
    },
    isTrialActive: {
      type: Boolean,
      default: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired'],
      default: 'trial',
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure email uniqueness within each tenant
ownerMasterSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

const OwnerMaster = mongoose.model("OwnerMaster", ownerMasterSchema);

module.exports = {
  model: OwnerMaster,
  schema: ownerMasterSchema,
};