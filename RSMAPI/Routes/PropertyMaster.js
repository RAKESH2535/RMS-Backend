const express = require("express");
const router = express();
const PropertyMaster = require("../Models/PropertyMasterModel");
const authMiddleware = require("../Middleware/authMiddleware");
const ownerMasterSchema = require("../Models/OwnerMasterModel");

router.use(express.json());

// get all
router.get("/propertymaster", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster GET ALL - User role:", req.user.role);
    // Allow both Owner and SuperAdmin to access property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access Denied" });
    }
    
    let getAll;
    if (req.user.role === "SuperAdmin") {
      // SuperAdmin can see all properties
      getAll = await PropertyMaster.model.find().populate("ownerMasters");
    } else {
      // Owner can only see their own properties based on tenant_id
      getAll = await PropertyMaster.model.find({ tenant_id: req.user.tenant_id }).populate("ownerMasters");
    }
    res.json(getAll);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: error.message });
  }
});

//get by id
router.get("/propertymaster/:id", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster GET BY ID - User role:", req.user.role);
    // Allow both Owner and SuperAdmin to access property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const propertyMasterId = req.params.id;
    const getById = await PropertyMaster.model
      .findById(propertyMasterId)
      .populate("ownerMasters");
    if (!getById) {
      res.status(400).json({ message: "PropertyMaster not found" });
    }

    res.json(getById);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: error.message });
  }
});

// create
router.post("/propertymaster", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster CREATE - User role:", req.user.role);
    console.log("PropertyMaster CREATE - Request body:", req.body);
    // Allow both Owner and SuperAdmin to create property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    // Log the request body to see what's being sent
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Ensure tenant_id is set from the authenticated user
    if (!req.body.tenant_id && req.user.tenant_id) {
      req.body.tenant_id = req.user.tenant_id;
    }

    // Validate that tenant_id is present
    if (!req.body.tenant_id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Validate that ownerMasters is present
    if (!req.body.ownerMasters) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    const propertyMasterData = new PropertyMaster.model(req.body);

    // Log the data before saving
    console.log("PropertyMaster data to save:", propertyMasterData);

    if (req.body === "") {
      res.status(400).json({ message: "Invalid request body" });
    }

    await propertyMasterData.save();
    res.status(200).json({ message: "PropertyMaster saved to the database" });
  } catch (error) {
    console.log("PropertyMaster CREATE - Error:", error);
    console.log("PropertyMaster CREATE - Error stack:", error.stack);
    res
      .status(500)
      .json({ message: "Failed to save data", error: error.message });
  }
});

// update propertymaster by id
router.put("/propertymaster/:id", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster UPDATE - User role:", req.user.role);
    // Allow both Owner and SuperAdmin to update property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const propertyMasterId = req.params.id;
    const { id, pincode, address2, city, address1, ownerMasters, state } =
      req.body;

    // Ensure that the request body contains at least one field to update
    if (
      !pincode &&
      !address2 &&
      !city &&
      !address1 &&
      !ownerMasters &&
      !id &&
      !state
    ) {
      return res.status(400).json({
        message:
          "At least one field (id,pincode,address2,city,address1,ownerMasters,state) is required for update",
      });
    }

    const updatedData = await PropertyMaster.model.findByIdAndUpdate(
      propertyMasterId,
      { pincode, address2, city, address1, ownerMasters, id, state },
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      return res
        .status(404)
        .json({ message: "OwnerMasterId not found for updation" });
    }

    res.json({ message: "update successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating data", error: error.message });
  }
});

// delete
router.delete("/propertymaster/:id", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster DELETE - User role:", req.user.role);
    // Allow both Owner and SuperAdmin to delete property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const getID = req.params.id;
    const deleteById = await PropertyMaster.model.findByIdAndDelete(getID);

    if (!deleteById) {
      return res.status(404).json({
        message: "Please enter correct PropertyMasterId for deletion",
      });
    }

    res.json({ message: `${req.params.id} deleted successfully` });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete the PropertyMaster",
      error: error.message,
    });
  }
});

//delete all
router.delete("/propertymaster", authMiddleware, async (req, res) => {
  try {
    console.log("PropertyMaster DELETE ALL - User role:", req.user.role);
    // Allow both Owner and SuperAdmin to delete all property master data
    if (req.user.role !== "Owner" && req.user.role !== "SuperAdmin") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const propertymaster = await PropertyMaster.model.deleteMany({});

    if (propertymaster.deletedCount == 0) {
      return res
        .status(404)
        .json({ message: "No RentMaster records found to delete." });
    }
    res
      .status(200)
      .json({ message: "All property master data deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete the post",
      error: error.message,
    });
  }
});

module.exports = router;