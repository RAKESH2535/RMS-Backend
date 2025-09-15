const express = require("express");
const router = express();
const bcrypt = require("bcrypt");
const OwnerMaster = require("../Models/OwnerMasterModel");
const TenantMaster = require("../Models/TenantMasterModel");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(express.json());

// Get all
router.get("/ownermaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });
    const getAll = await OwnerMaster.model.find().populate("createdBy");
    res.json(getAll);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve data", error: err.message });
  }
});

// Get by ID
router.get("/ownermaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });
    const Id = req.params.id;
    const getById = await OwnerMaster.model.findById(Id).populate("createdBy");
    if (!getById) {
      return res.status(404).json({ message: "OwnerMaster not found" });
    }
    res.json(getById);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving data", error: error.message });
  }
});

// ownermasterlogin
router.post("/ownermasterlogin", async (req, res) => {
  try {
    // finding a OwnerMaster
    await OwnerMaster.model
      .findOne({
        email: req.body.email,
      })
      .then(async (ownerMaster) => {
        // comparing a password
        const passwordCheck = await bcrypt.compare(
          req.body.password,
          ownerMaster.password
        );
        try {
          if (!passwordCheck) {
            return res.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          // Check trial period
          if (ownerMaster.subscriptionStatus === 'trial' && ownerMaster.trialEndDate) {
            const currentDate = new Date();
            const daysRemaining = Math.ceil((ownerMaster.trialEndDate - currentDate) / (1000 * 60 * 60 * 24));

            // If trial has expired, block access
            if (currentDate > ownerMaster.trialEndDate) {
              return res.status(403).send({
                message: "Your free trial period has expired. Please subscribe to continue using the service.",
                trialExpired: true
              });
            }

            // Add days remaining to owner object for frontend display
            ownerMaster.daysRemainingInTrial = daysRemaining;
          }

          // generating a token with the correct payload structure
          const token = jwt.sign(
            {
              userId: ownerMaster._id,
              userEmail: ownerMaster.email,
              userName: ownerMaster.name,
              role: ownerMaster.role,
              tenant_id: ownerMaster.tenant_id || null
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          // Remove password from response
          const ownerResponse = ownerMaster.toObject();
          // Add daysRemainingInTrial to the response if it exists
          if (ownerMaster.daysRemainingInTrial !== undefined) {
            ownerResponse.daysRemainingInTrial = ownerMaster.daysRemainingInTrial;
          }
          delete ownerResponse.password;

          return res.status(200).send({
            message: "Login Successful",
            user: ownerResponse,
            token,
            tenant_id: ownerMaster.tenant_id
          });
        } catch (error) {
          // catch error if password do not match
          res.status(400).send({
            message: "Invalid credentials, Email or Password not found",
            error,
          });
        }
      })
      .catch((error) => {
        return res.status(404).json({
          message: "Unable to find OwnerMaster",
          error,
        });
      });
  } catch (error) {
    return res.status(400).json({
      message: "Error connecting to the Database",
      error: error.message,
    });
  }
});

// create
router.post("/ownermaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });

    //find OwnerMaster from the default connection
    const ownermaster = await OwnerMaster.model.findOne({
      email: req.body.email,
    });

    //checking tenantmaster exist or not
    if (ownermaster) {
      return res
        .status(201)
        .json({ message: `${req.body.name} Owner already exist` });
    }

    // hash the password
    const hashedpassword = await bcrypt.hash(req.body.password, 10);

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Please Enter Data" });
    }

    //saving TenantMaster to the default connection
    const ownermasterData = new OwnerMaster.model({
      name: req.body.name,
      email: req.body.email,
      password: hashedpassword,
      dbName: req.body.name,
      phone: req.body.phone,
      createdBy: req.body.createdBy,
    });
    await Promise.all([ownermasterData.save()]); // ownermaster saved to the tenant_${dbName} // tenant saved to the db in default connection await

    res.status(201).json({
      message: `Owner saved to the database`,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error saving Owner", error: error.message });
  }
});

// update
router.put("/ownermaster/:id", authMiddleware, async (req, res) => {

  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });

    const ownerMasterId = req.params.id;
    const { name, email, password, phone } = req.body;

    // Ensure that the request body contains at least one field to update
    if (!name && !email && !password && !phone) {
      return res.status(400).json({
        message:
          "At least one field (name, emailaddress, password, phone) is required for update",
      });
    }

    const updatedData = await OwnerMaster.model.findByIdAndUpdate(
      ownerMasterId,
      { name, email, password, phone },
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

// Delete
router.delete("/ownermaster/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });

    const getId = req.params.id;

    const deletedData = await OwnerMaster.model.findByIdAndDelete(getId);

    if (!deletedData) {
      return res.status(404).json({ message: "OwnerMaster not found" });
    }
    res.json({ message: `${getId} deleted successfully from database` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting data", error: error.message });
  }
});

// Delete all
router.delete("/ownermaster", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin")
      return res.json({ message: "Access Denied" });

    await OwnerMaster.model.deleteMany({});

    res.json({ message: "All owner master data deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting all data", error: error.message });
  }
});

module.exports = router;
