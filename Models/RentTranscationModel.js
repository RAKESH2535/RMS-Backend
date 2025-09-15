const mongoose = require("mongoose");

const RentTranscationSchema = mongoose.Schema({
  tenant_id: {
    type: String,
    required: true,
    index: true,
  },
  RentFrom: {
    type: Date,
    required: true,
  },
  RentTo: {
    type: Date,
    required: true,
  },
  paymentThreshold: {
    type: Date,
    required: true,
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
  propertyMaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PropertyMaster",
    required: true,
  },
  rentMaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RentMaster",
    required: true,
  },
  ownerMasters: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OwnerMaster",
    required: true,
  },
});

const RentTranscation = mongoose.model(
  "RentTranscation",
  RentTranscationSchema
);

module.exports = {
  model: RentTranscation,
  schema: RentTranscationSchema,
};
