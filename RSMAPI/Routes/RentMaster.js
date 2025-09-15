const express = require("express");
const router = express.Router();
const RentMaster = require("../Models/RentMasterModel");
const PropertyMasterSchema = require("../Models/PropertyMasterModel");
const authMiddleware = require("../Middleware/authMiddleware");
const ownerMasterSchema = require("../Models/OwnerMasterModel");

router.use(express.json());

//get all rentmaster
router.get("/rentmaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const getAll = await RentMaster.model
      .find()
      .populate("ownerMasters")
      .populate("propertymaster").populate("clientMaster");

    if (getAll.length == 0) {
      return res
        .status(200)
        .json({ message: "Please enter at least one RentMaster" });
    }

    res.json(getAll);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrive RentMaster", error: error.message });
  }
});

//get rentmaster by id
router.get("/rentmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const getById = await RentMaster.model
      .findById(req.params.id)
      .populate("ownerMasters")
      .populate("propertymaster").populate('clientMaster');

    if (!getById) {
      return res.status(404).json({ message: "RentMaster not found by Id" });
    }

    res.json(getById);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrive RentMaster", error: error.message });
  }
});

//create a rentmaster
router.post("/rentmaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const rentmaster = await RentMaster.model(req.body);
    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Please enter some data for RentMaster" });
    }
    await rentmaster.save();
    res.status(201).json({ message: "RentMaster saved to the database" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error,While saving RentMaster", error: error.message });
  }
});

// update rentmaster by id
router.put("/rentmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const {
      electricityMeterNumber,
      clientMaster,
      incrementPercentage,
      securityDepositAmount,
      monthlyRent,
      incrementSchedule,
      propertymaster,
      ownerMasters,
    } = req.body;

    // Ensure that the request body contains at least one field to update
    if (
      !electricityMeterNumber &&
      !clientMaster &&
      !incrementPercentage &&
      !securityDepositAmount &&
      !monthlyRent &&
      !incrementSchedule &&
      !propertymaster &&
      !ownerMasters
    ) {
      return res.status(400).json({
        message:
          "At least one field (electricityMeterNumber, clientMaster, incrementPercentage, securityDepositAmount,monthlyRent,incrementSchedule,propertymaster) is required for update",
      });
    }
    const updateData = await RentMaster.model.findByIdAndUpdate(
      req.params.id,
      {
        electricityMeterNumber,
        clientMaster,
        incrementPercentage,
        securityDepositAmount,
        monthlyRent,
        incrementSchedule,
        propertymaster,
        ownerMasters,
      },
      { new: true, runValidators: true }
    );

    if (!updateData) {
      return res
        .status(400)
        .json({ message: "Please enter correct RentMasterId" });
    }
    res.json({ message: "update successfully" });
  } catch (error) {
    res.status(400).json({
      message: "Error,While updating RentMaster",
      error: error.message,
    });
  }
});

// delete rentmaster by id
router.delete("/rentmaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const rentmaster = await RentMaster.model.findByIdAndDelete(req.params.id);

    if (!rentmaster) {
      return res
        .status(404)
        .json({ message: "Please enter correct RentMasterId for deletion" });
    }

    res.json({ message: `${req.params.id} deleted successfully` });
  } catch (error) {
    res.status(500).json({
      message: "Error,While deleting RentMaster",
      error: error.message,
    });
  }
});

//delete all rentmaster
router.delete("/rentmaster", async (req, res) => {
  try {
    if (req.user.role !== "Owner") {
      return res.status(500).json({ message: "Access Denied" });
    }

    const rentmaster = await RentMaster.model.deleteMany({});
    if (rentmaster.deletedCount == 0) {
      return res.status(404).json({ message: "Failed to delete the post" });
    }

    res
      .status(200)
      .json({ message: "All RentMaster records successfully deleted." });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete the post",
      error: error.message,
    });
  }
});

module.exports = router;
