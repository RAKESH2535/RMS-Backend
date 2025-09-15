require('dotenv').config();
const nodemailer = require("nodemailer");

// In-memory OTP storage (for production, use Redis or database)
const otpStorage = new Map();

const sendEmail = async (email, subject, text) => {
  try {
    console.log('Email configuration:', {
      service: 'gmail',
      user: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      text: text,
    };

    console.log('Sending email to:', email);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration and attempt tracking
const storeOTP = (identifier, otp) => {
  const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStorage.set(identifier, {
    otp,
    expiresAt: expirationTime,
    attempts: 0,
    maxAttempts: 3
  });
};

// Verify OTP
const verifyOTP = (identifier, userOTP) => {
  const otpData = otpStorage.get(identifier);

  if (!otpData) {
    return { success: false, message: "OTP not found or expired" };
  }

  if (Date.now() > otpData.expiresAt) {
    otpStorage.delete(identifier);
    return { success: false, message: "OTP has expired" };
  }

  if (otpData.attempts >= otpData.maxAttempts) {
    otpStorage.delete(identifier);
    return { success: false, message: "Maximum OTP attempts exceeded" };
  }

  otpData.attempts++;

  if (otpData.otp !== userOTP) {
    return { success: false, message: "Invalid OTP" };
  }

  // OTP verified successfully
  otpStorage.delete(identifier);
  return { success: true, message: "OTP verified successfully" };
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  const subject = "Verify Your Email - RMS Registration";
  const text = `Your verification code is: ${otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

Thank you,
Rent Management System Team`;

  try {
    await sendEmail(email, subject, text);
    console.log('OTP email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail
};