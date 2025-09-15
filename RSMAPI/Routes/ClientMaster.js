const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ClientMaster = require("../Models/ClientMasterModel");
const authMiddleware = require("../Middleware/authMiddleware");
const ownerMasterSchema = require("../Models/OwnerMasterModel");
const { createTenantFilter, addTenantId } = require("../utils/tenantUtils");

router.use(express.json());

// get all data
router.get("/clientmaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    let query = {};

    // Apply tenant filtering for Owners
    if (req.user.role === "Owner" && req.user.tenant_id) {
      query = createTenantFilter(req.user.tenant_id);
    }
    // SuperAdmin can see all clients

    const getAll = await ClientMaster.model.find(query).populate("ownerMasters");

    if (getAll.length == 0) {
      return res
        .status(200)
        .json({ message: "Please enter at least one Client Master" });
    }
    res.json(getAll);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// get by id
router.get("/clientmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const id = req.params.id;
    let query = { _id: id };

    // Apply tenant filtering for Owners
    if (req.user.role === "Owner" && req.user.tenant_id) {
      query = createTenantFilter(req.user.tenant_id, { _id: id });
    }

    const getById = await ClientMaster.model
      .findOne(query)
      .populate("ownerMasters");

    if (!getById) {
      return res.status(404).json({ message: "Client Master not found" });
    }
    res.json(getById);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// login client master
router.post("/clientmasterlogin", async (req, res) => {
  try {
    // finding a ClientMaster
    const clientMaster = await ClientMaster.model.findOne({
      email: req.body.email,
    });

    if (!clientMaster) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // comparing a password
    const passwordCheck = await bcrypt.compare(
      req.body.password,
      clientMaster.password
    );

    if (!passwordCheck) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // generating a token with tenant_id
    const token = jwt.sign(
      {
        userId: clientMaster._id,
        userEmail: clientMaster.email,
        userName: clientMaster.name,
        role: clientMaster.role,
        tenant_id: clientMaster.tenant_id || null
      },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );

    // Remove password from response
    const clientResponse = clientMaster.toObject();
    delete clientResponse.password;

    return res.status(200).json({
      message: "Login Successful",
      user: clientResponse,
      token,
      tenant_id: clientMaster.tenant_id
    });

  } catch (error) {
    return res.status(400).json({
      message: "Error connecting to the Database",
      error: error.message,
    });
  }
});

//create Client Master
router.post("/clientmaster", authMiddleware, async (req, res) => {
  try {
    // Ensure the user has the proper role
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    // Prepare tenant filter for checking existing clients
    let tenantFilter = {};
    
    // For Owner role, check only within their tenant
    if (req.user.role === "Owner" && req.user.tenant_id) {
      tenantFilter = { email: req.body.email, tenant_id: req.user.tenant_id };
    } 
    // For SuperAdmin, check across all tenants or use a specific filter
    else if (req.user.role === "SuperAdmin") {
      // SuperAdmin can create clients with same email across different tenants
      // So we only check within the specified tenant if provided
      if (req.body.tenant_id) {
        tenantFilter = { email: req.body.email, tenant_id: req.body.tenant_id };
      } else {
        // If no tenant_id provided for SuperAdmin, check if email exists at all
        tenantFilter = { email: req.body.email };
      }
    }

    // Check if client already exists within the same tenant
    const client = await ClientMaster.model.findOne(tenantFilter);

    if (client) {
      return res.status(200).json({ message: 'Client Already exist for this tenant' });
    }

    // Check if the request body is empty
    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Please enter some data for ClientMaster" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Prepare client data with tenant_id for Owners
    let clientData = {
      name: req.body.name,
      gender: req.body.gender,
      fatherName: req.body.fatherName,
      address1: req.body.address1,
      address2: req.body.address2,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      password: hashedPassword,
      ownerMasters: req.body.ownerMasters,
    };

    // Add tenant_id for Owner role
    if (req.user.role === "Owner" && req.user.tenant_id) {
      clientData = addTenantId(clientData, req.user.tenant_id);
    }
    // For SuperAdmin, use provided tenant_id or default
    else if (req.user.role === "SuperAdmin" && req.body.tenant_id) {
      clientData = addTenantId(clientData, req.body.tenant_id);
    }

    // Create the new ClientMaster object
    const clientMaster = new ClientMaster.model(clientData);

    // Save the new client master
    await clientMaster.save();

    return res
      .status(201)
      .json({ message: "Client Master Created Successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Error while saving ClientMaster",
      error: error.message,
    });
  }
});

// update rentmaster by id
router.put("/clientmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }
    const {
      name,
      gender,
      address1,
      email,
      password,
      address2,
      mobileNumber,
      fatherName,
      ownerMasters,
    } = req.body;

    // Ensure that the request body contains at least one field to update
    if (
      !name &&
      !gender &&
      !address1 &&
      !email &&
      !password &&
      !address2 &&
      !mobileNumber &&
      !fatherName &&
      !ownerMasters
    ) {
      return res.status(400).json({
        message: "At least one record is required for update",
      });
    }

    const updateData = await ClientMaster.model.findByIdAndUpdate(
      req.params.id,
      {
        name,
        gender,
        address1,
        email,
        password,
        address2,
        mobileNumber,
        fatherName,
        ownerMasters,
      },
      { new: true, runValidators: true }
    );

    if (!updateData) {
      return res
        .status(400)
        .json({ message: "Please enter correct Client MasterId" });
    }

    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    res.status(400).json({
      message: "Error,While updating Client Master",
      error: error.message,
    });
  }
});

// delete by id
router.delete("/clientmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }
    const id = req.params.id;

    const deletedData = await ClientMaster.model.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(400).json({ message: "Client Master id not found" });
    }
    res.json({ message: `${id} is deletd successfully` });
  } catch (error) {
    res.status(500).json({
      message: "Error,While deleting Client Master",
      error: error.message,
    });
  }
});

//delete all
router.delete("/clientmaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const deletedData = await ClientMaster.model.deleteMany({});

    if (deletedData.deletedCount == 0) {
      return res
        .status(404)
        .json({ message: "No RentMaster records found to delete." });
    }

    res
      .status(200)
      .json({ message: "All Client Master records successfully deleted." });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while deleting Client Master records.",
      error: error.message,
    });
  }
});

module.exports = router;
