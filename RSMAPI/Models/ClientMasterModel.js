const mongoose = require("mongoose");
const { Schema } = mongoose;

const ClientMasterSchema = new Schema(
  {
    tenant_id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: false,
    },
    address1: {
      type: String,
      required: false,
    },
    address2: {
      type: String,
      required: false,
    },
    mobileNumber: {
      type: Number,
      required: false,
    },
    email: {
      type: String,
      required: [false, "Please provide email"],
      // Remove unique constraint to allow same emails across different tenants
    },
    password: {
      type: String,
      required: [false, "Please provide password"],
      unique: false,
    },
    fatherName: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: "ClientMaster",
    },

    ownerMasters: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerMaster",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create a compound index to ensure email uniqueness within each tenant
ClientMasterSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

const ClientMaster = mongoose.model("ClientMaster", ClientMasterSchema);

module.exports = {
  model: ClientMaster,
  schema: ClientMasterSchema,
};