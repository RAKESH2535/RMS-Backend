// external imports
const mongoose = require("mongoose");
require("dotenv").config();

async function dbTenantConnect(dbName) {
  // use mongoose to connect this app to our database on mongoDB using the DB_URL (connection string)
  const db = mongoose
      .createConnection(`mongodb+srv://TechEmpUser:Password.123@techharvestcluster.wrvysg0.mongodb.net/tenant_${dbName}`, {
          //   these are options to ensure that the connection is done properly
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useCreateIndex: true,
          useFindAndModify: false,
      })
    

     db.once('open', () => console.info("MongoDB secondary connection opened!"));
    db.on('connected', () => console.info(`MongoDB secondary connection succeeded!`));

    return db;
}

module.exports = dbTenantConnect;
