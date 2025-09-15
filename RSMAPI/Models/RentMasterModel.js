const mongoose = require("mongoose");
const { Schema } = mongoose;

const RentMasterSchema = new Schema(
  {
    tenant_id: {
      type: String,
      required: true,
      index: true,
    },
    electricityMeterNumber: {
      type: String,
      required: true,
    },
    incrementPercentage: {
      type: mongoose.Decimal128,
      required: true,
    },
    securityDepositAmount: {
      type: mongoose.Decimal128,
      required: true,
    },
    monthlyRent: {
      type: mongoose.Decimal128,
      required: true,
    },
    incrementSchedule: {
      type: mongoose.Decimal128,
      required: true,
    },
    paymentDate: {
      type: String,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    clientMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientMaster",
      required: true,
    },
    ownerMasters: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerMaster",
      required: true,
    },
    propertymaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyMaster",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const RentMaster = mongoose.model("RentMaster", RentMasterSchema);

module.exports = {
  model: RentMaster,
  schema: RentMasterSchema,
};
