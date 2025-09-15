const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// require database connection
const dbConnect = require("./db/dbConnect");
const auth = require('./Routes/Authentication')

// execute database connection
dbConnect();

module.exports = auth;
