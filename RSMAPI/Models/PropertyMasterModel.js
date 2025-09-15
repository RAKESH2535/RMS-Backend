const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the main schema
const PropertyMasterSchema = new Schema(
  {
    tenant_id: {
      type: String,
      required: true,
      index: true,
    },
    pincode: {
      type: String, // Changed from Schema.Types.Decimal128 to String
      required: true,
    },
    address1: {
      type: String,
      required: true,
    },
    address2: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    ownerMasters: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerMaster", // Reference to OwnerMaster schema
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create a model from the schema
const PropertyMaster = mongoose.model("PropertyMaster", PropertyMasterSchema);

module.exports = {
  model: PropertyMaster,
  schema: PropertyMasterSchema,
};