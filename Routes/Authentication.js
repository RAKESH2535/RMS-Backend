require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const ownerMaster = require("./OwnerMaster");
const propertyMaster = require("./PropertyMaster");
const rentMaster = require("./RentMaster");
const clientMaster = require("./ClientMaster");
const appRoutes = require("./AppRoutes");
const RentTranscation = require('./RentTranscation')
const ownerSelfRegister = require('./OwnerSelfRegister')
var cors = require('cors')

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// More explicit CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ["Authorization"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
}));

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(appRoutes);
app.use(ownerMaster);
app.use(propertyMaster);
app.use(rentMaster);
app.use(clientMaster);
app.use(RentTranscation)
app.use(ownerSelfRegister)


app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

module.exports = app;