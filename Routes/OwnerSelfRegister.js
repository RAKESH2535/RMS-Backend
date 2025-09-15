const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OwnerMaster = require("../Models/OwnerMasterModel");
const { generateTenantId, validateTenantId } = require("../utils/tenantUtils");
const { generateOTP, storeOTP, verifyOTP, sendOTPEmail, sendEmail } = require("../utils/sendEmail");

const router = express.Router();

// Owner Self-Registration Route
router.post("/owner/self-register", async (req, res) => {
    try {
        const {
            // Personal Information
            name, email, password, phone, alternatePhone, aadharNumber, panNumber,
            // Address Information  
            address, city, state, pincode,
            // Business Information
            companyName, businessType, gstNumber,
            // Banking Information
            bankAccountNumber, ifscCode, bankName
        } = req.body;

        // Validation for required fields
        if (!name || !email || !password || !phone || !aadharNumber || !address || !city || !state || !pincode) {
            return res.status(400).json({
                message: "Please provide all required fields: name, email, password, phone, aadharNumber, address, city, state, pincode"
            });
        }

        // Validate Aadhar number format (12 digits)
        if (!/^\d{12}$/.test(aadharNumber)) {
            return res.status(400).json({
                message: "Aadhar number must be 12 digits"
            });
        }

        // Validate PAN number format if provided
        if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
            return res.status(400).json({
                message: "Invalid PAN number format"
            });
        }

        // Check if owner already exists
        const existingOwner = await OwnerMaster.model.findOne({
            $or: [
                { email: email.toLowerCase() },
                { aadharNumber: aadharNumber }
            ]
        });

        if (existingOwner) {
            return res.status(400).json({
                message: "Owner with this email or Aadhar number already exists"
            });
        }

        // Generate unique tenant_id
        const tenantId = generateTenantId();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Calculate trial end date (30 days from now)
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        // Create new owner with trial period
        const newOwner = new OwnerMaster.model({
            tenant_id: tenantId,
            // Personal Information
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone.trim(),
            alternatePhone: alternatePhone ? alternatePhone.trim() : null,
            aadharNumber: aadharNumber.trim(),
            panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
            // Address Information
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            // Business Information
            companyName: companyName ? companyName.trim() : null,
            businessType: businessType || 'Individual',
            gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : null,
            // Banking Information
            bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : null,
            ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : null,
            bankName: bankName ? bankName.trim() : null,
            role: "Owner",
            // Trial period fields
            trialStartDate: trialStartDate,
            trialEndDate: trialEndDate,
            isTrialActive: true,
            subscriptionStatus: 'trial'
        });

        // Save owner to database
        const savedOwner = await newOwner.save();

        // Generate JWT token with tenant_id
        const token = jwt.sign(
            {
                userId: savedOwner._id,
                userEmail: savedOwner.email,
                userName: savedOwner.name,
                role: savedOwner.role,
                tenant_id: savedOwner.tenant_id
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
        );

        // Remove password from response
        const ownerResponse = savedOwner.toObject();
        delete ownerResponse.password;

        res.status(201).json({
            message: "Owner registered successfully",
            owner: ownerResponse,
            token,
            tenant_id: savedOwner.tenant_id
        });

    } catch (error) {
        console.error("Owner registration error:", error);
        res.status(500).json({
            message: "Error registering owner",
            error: error.message
        });
    }
});

// Owner Login Route (Updated to work with OwnerMaster model)
router.post("/owner/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        // Find owner by email
        const owner = await OwnerMaster.model.findOne({ email: email.toLowerCase() });

        if (!owner) {
            return res.status(404).json({
                message: "Owner not found"
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, owner.password);

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        // Check trial period
        if (owner.subscriptionStatus === 'trial' && owner.trialEndDate) {
            const currentDate = new Date();
            const daysRemaining = Math.ceil((owner.trialEndDate - currentDate) / (1000 * 60 * 60 * 24));

            // If trial has expired, block access
            if (currentDate > owner.trialEndDate) {
                return res.status(403).json({
                    message: "Your free trial period has expired. Please subscribe to continue using the service.",
                    trialExpired: true
                });
            }

            // Add days remaining to owner object for frontend display
            owner.daysRemainingInTrial = daysRemaining;
        }

        // Generate JWT token with tenant_id
        const token = jwt.sign(
            {
                userId: owner._id,
                userEmail: owner.email,
                userName: owner.name,
                role: owner.role,
                tenant_id: owner.tenant_id
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
        );

        // Remove password from response
        const ownerResponse = owner.toObject();
        // Add daysRemainingInTrial to the response if it exists
        if (owner.daysRemainingInTrial !== undefined) {
            ownerResponse.daysRemainingInTrial = owner.daysRemainingInTrial;
        }
        delete ownerResponse.password;

        res.status(200).json({
            message: "Login successful",
            user: ownerResponse,
            token,
            tenant_id: owner.tenant_id
        });

    } catch (error) {
        console.error("Owner login error:", error);
        res.status(500).json({
            message: "Error logging in",
            error: error.message
        });
    }
});

// Send OTP Route
router.post("/owner/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP with email as identifier
        storeOTP(email, otp);

        // Send OTP via email
        await sendOTPEmail(email, otp);

        console.log('OTP sent successfully for email:', email);
        res.status(200).json({
            message: "OTP sent successfully to your email",
            expiresIn: "5 minutes"
        });

    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({
            message: "Error sending OTP",
            error: error.message
        });
    }
});

// Verify OTP Route
router.post("/owner/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        // Verify OTP
        const verificationResult = verifyOTP(email, otp);

        if (verificationResult.success) {
            res.status(200).json({
                message: "Email verified successfully",
                verified: true
            });
        } else {
            res.status(400).json({
                message: verificationResult.message,
                verified: false
            });
        }

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            message: "Error verifying OTP",
            error: error.message
        });
    }
});

// Test email route
router.post("/test-email", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        console.log('Testing email to:', email);
        console.log('Environment variables:', {
            GMAIL_USER: process.env.GMAIL_USER,
            hasPassword: !!process.env.GMAIL_APP_PASSWORD
        });

        await sendEmail(email, "Test Email", "This is a test email from RMS system.");

        res.status(200).json({ message: "Test email sent successfully" });
    } catch (error) {
        console.error("Test email error:", error);
        res.status(500).json({
            message: "Error sending test email",
            error: error.message
        });
    }
});

module.exports = router;