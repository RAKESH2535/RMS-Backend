const express = require("express");
const router = express();
const PropertyMasterSchema = require("../Models/PropertyMasterModel");
const authMiddleware = require("../Middleware/authMiddleware");
const rentMasterSchema = require("../Models/RentMasterModel");
const RentTranscation = require("../Models/RentTranscationModel");
const ClientMaster = require("../Models/ClientMasterModel");

router.use(express.json());

router.get("/rentTranscation", authMiddleware, async (req, res) => {
  try {
    // Allow both Owner and ClientMaster to view rent transactions
    if (req.user.role !== "Owner" && req.user.role !== "ClientMaster") {
      return res.status(403).json({ message: "Access Denied" });
    }

    let getAll;
    if (req.user.role === "Owner") {
      // Owners see all transactions for their tenant
      getAll = await RentTranscation.model
        .find({ tenant_id: req.user.tenant_id })
        .populate("propertyMaster")
        .populate('clientMaster')
        .populate("rentMaster")
        .populate("ownerMasters");
    } else if (req.user.role === "ClientMaster") {
      // ClientMasters see all transactions where they are the client, regardless of tenant
      // First, find the client's email address
      const client = await ClientMaster.model.findById(req.user.userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Find all client records with the same email
      const allClientRecords = await ClientMaster.model.find({ email: client.email });
      const clientIds = allClientRecords.map(record => record._id);

      // Find all transactions for any of these client records
      getAll = await RentTranscation.model
        .find({ clientMaster: { $in: clientIds } })
        .populate("propertyMaster")
        .populate('clientMaster')
        .populate("rentMaster")
        .populate("ownerMasters");
    }

    return res.json(getAll);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: error.message });
  }
});

router.get("/rentTranscation/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner" && req.user.role !== "ClientMaster") {
      return res.status(403).json({ message: "Access Denied" });
    }

    // Find the transaction and verify tenant access
    const transaction = await RentTranscation.model
      .findById(req.params.id)
      .populate("propertyMaster")
      .populate('clientMaster')
      .populate("rentMaster")
      .populate("ownerMasters");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // For Owner, verify tenant access
    if (req.user.role === "Owner" && transaction.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // For ClientMaster, verify they are the client in this transaction
    if (req.user.role === "ClientMaster") {
      // Find the client's email address
      const client = await ClientMaster.model.findById(req.user.userId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check if this transaction is for any client record with the same email
      const allClientRecords = await ClientMaster.model.find({ email: client.email });
      const clientIds = allClientRecords.map(record => record._id.toString());

      if (!clientIds.includes(transaction.clientMaster._id.toString())) {
        return res.status(403).json({ message: "Access Denied" });
      }
    }

    res.json(transaction);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: error.message });
  }
});

router.post("/rentTranscation", authMiddleware, async (req, res) => {
  try {
    // Only Owner should be able to create rent transactions
    if (req.user.role !== "Owner") {
      return res.status(403).json({ message: "Access Denied: Only owners can create rent transactions" });
    }

    if (Object.keys(req.body).length == 0) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    // Validate required fields
    const requiredFields = ['RentFrom', 'RentTo', 'paymentThreshold', 'paymentMode', 'clientMaster', 'propertyMaster', 'rentMaster', 'ownerMasters', 'tenant_id'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    // Ensure the tenant_id matches the user's tenant_id for security
    if (req.body.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ message: "Access Denied: Invalid tenant" });
    }

    const rentTranscationData = new RentTranscation.model(req.body);

    await rentTranscationData.save();
    res.status(200).json({ message: "RentRecipt saved to the database" });
  } catch (error) {
    console.error("Error saving rent transaction:", error);
    res
      .status(500)
      .json({ message: "Failed to save data", error: error.message });
  }
});

module.exports = router;