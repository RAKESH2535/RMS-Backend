const express = require("express");
const app = express();
const User = require("../Models/userModel");
const auth = require("../auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
const OwnerMaster = require("../Models/OwnerMasterModel");
const ClientMaster = require("../Models/ClientMasterModel");
const { generateTenantId } = require("../utils/tenantUtils");
const axios = require("axios");

// Admin registration disabled - Admin users should use SSO only
app.post("/register", async (request, response) => {
  return response.status(403).json({
    message: "Admin registration is disabled. Please use Microsoft SSO for admin access."
  });
});

// SSO Token Exchange - Convert Microsoft token to backend JWT
app.post("/auth/sso-exchange", async (request, response) => {
  try {
    const { microsoftToken, userProfile } = request.body;

    if (!microsoftToken || !userProfile) {
      return response.status(400).json({
        message: "Microsoft token and user profile are required"
      });
    }

    // Verify Microsoft token by calling Microsoft Graph API
    try {
      const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${microsoftToken}`
        }
      });

      // Token is valid, proceed with user creation/update
      const { id, mail, userPrincipalName, displayName } = graphResponse.data;
      const email = mail || userPrincipalName;

      // Find or create SuperAdmin user
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Create new SuperAdmin user
        user = new User({
          email: email.toLowerCase(),
          password: await bcrypt.hash(id + Date.now(), 10), // Random password since SSO is used
          role: "SuperAdmin"
        });
        await user.save();
      }

      // Generate backend JWT token
      const backendToken = jwt.sign(
        {
          userId: user._id,
          userEmail: user.email,
          userName: displayName,
          role: user.role,
          ssoId: id
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );

      response.status(200).json({
        message: "SSO authentication successful",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: displayName
        },
        token: backendToken,
        ssoId: id
      });

    } catch (microsoftError) {
      console.error("Microsoft token verification failed:", microsoftError.response?.data || microsoftError.message);
      return response.status(401).json({
        message: "Invalid Microsoft token"
      });
    }

  } catch (error) {
    console.error("SSO exchange error:", error);
    response.status(500).json({
      message: "Error during SSO authentication",
      error: error.message
    });
  }
});

// login endpoint - supports Owner and Client login only (Admin uses SSO)
app.post("/login", async (request, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({
      message: "Please provide email and password"
    });
  }

  try {
    // Try to find user in different models
    let user = null;
    let userType = null;
    let tenant_id = null;

    // Check Owner
    user = await OwnerMaster.model.findOne({ email: email.toLowerCase() });
    if (user) {
      userType = "Owner";
      tenant_id = user.tenant_id;
    } else {
      // Check Client
      user = await ClientMaster.model.findOne({ email: email.toLowerCase() });
      if (user) {
        userType = "ClientMaster";
        // Get tenant_id from client's record
        tenant_id = user.tenant_id;
      }
    }

    if (!user) {
      return response.status(404).json({
        message: "User not found"
      });
    }

    // Check password
    const passwordCheck = await bcrypt.compare(password, user.password);

    if (!passwordCheck) {
      return response.status(400).json({
        message: "Invalid password"
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      userEmail: user.email,
      userName: user.name || user.email,
      role: userType
    };

    // Add tenant_id for Owner and Client
    if (tenant_id) {
      tokenPayload.tenant_id = tenant_id;
    }

    const token = jwt.sign(
      tokenPayload,
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return response.status(200).json({
      message: "Login Successful",
      user: userResponse,
      token,
      tenant_id: tenant_id
    });

  } catch (error) {
    console.error("Login error:", error);
    return response.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Only support password reset for Owner and Client (Admin uses SSO)
    const oldOwner = await OwnerMaster.model.findOne({ email });
    const oldClient = oldOwner ? null : await ClientMaster.model.findOne({ email });

    if (oldOwner) {
      const secret = process.env.JWT_SECRET + oldOwner.password;
      const token = jwt.sign(
        { email: oldOwner.email, id: oldOwner._id },
        secret,
        {
          expiresIn: "5m",
        }
      );
      const link = `http://localhost:5000/resetpassword?id=${oldOwner._id}&token=${token}`;

      // await sendEmail(oldAdmin.id, "Password reset", link)

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "st9889477@gmail.com",
          pass: "ldkl jltb bmao bgoq",
        },
      });

      var mailOptions = {
        from: "st9889477@gmail.com",
        to: "st9889477@gmail.com",
        subject: "Password",
        text: `We have received a request to reset your password. Please reset your password using the link below. ${link} 
      ,Reset Password`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.json({ error: error.message });
        } else {
          res.send("A password reset link sent to your Email Account");
        }
      });
    } else if (oldClient) {
      const secret = process.env.JWT_SECRET + oldClient.password;
      const token = jwt.sign(
        { email: oldClient.email, id: oldClient._id },
        secret,
        {
          expiresIn: "5m",
        }
      );
      const link = `https://localhost:5000/resetpassword?id=${oldClient._id}&token=${token}`;

      // await sendEmail(oldAdmin.id, "Password reset", link)

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "email@gmail.com ",
          pass: "ldkl jltb bmao bgoq",
        },
      });

      var mailOptions = {
        from: "email@gmail.com",
        to: "email@gmail.com",
        subject: "Password",
        text: `We have received a request to reset your password. Please reset your password using the link below. ${link} 
      ,Reset Password`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.json({ error: error.message });
        } else {
          res.send("A password reset link sent to your Email Account");
        }
      });
    } else {
      return res.json({ message: "User does not Exist!!" });
    }
  } catch (error) {
    res.status(400).send({ message: "Somethind Went Wrong" });
  }
});

// app.get("/resetpassword/:id/:token", async (req, res) => {
//   const { id, token } = req.params;
//   const oldAdmin = await User.findOne({ _id: id });

//   if (!oldAdmin) {
//     return res.json({ status: "User not Exist!!" });
//   }
//   const secret = process.env.JWT_SECRET + oldAdmin.password;

//   try {
//     const verify = jwt.verify(token, secret);
//     res.json("verifed");
//   } catch (error) {
//     res.send("not verified");
//   }
// });

app.post("/resetpassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  // Only support password reset for Owner and Client (Admin uses SSO)
  const oldOwner = await OwnerMaster.model.findOne({ _id: id });
  const oldClient = oldOwner ? null : await ClientMaster.model.findOne({ _id: id });

  if (oldOwner) {
    try {
      const secret = process.env.JWT_SECRET + oldOwner.password;
      const verify = jwt.verify(token, secret);
      if (!verify) {
        return res.json({ message: "Reset Password link is expired!" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      await OwnerMaster.model.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: hashedPassword,
          },
        }
      );
      res.json({ status: "Password Reset Successfully!!", verify });
    } catch (error) {
      res.json({ error: error.message });
    }
  } else if (oldClient) {
    try {
      const secret = process.env.JWT_SECRET + oldClient.password;
      const verify = jwt.verify(token, secret);
      if (!verify) {
        return res.json({ message: "Reset Password link is expired!" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      await ClientMaster.model.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: hashedPassword,
          },
        }
      );
      res.json({ status: "Password Reset Successfully!!", verify });
    } catch (error) {
      res.json({ error: error.message });
    }
  } else {
    return res.json({ status: "User not Exist!!" });
  }
});
// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.send({ message: "You are authorized to access me" });
});

// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.send({ message: "You are authorized to access me" });
});

module.exports = app;
