const mongoose = require("mongoose");
const databaseUrl = process.env.DB_URL;
const connectDB = async (startServer) => {
  mongoose
    .connect(databaseUrl)
    .then((connect) => {
      //   console.log("Connect to database: " + connect.connection.name);
      startServer();
    })
    .catch((error) => {
      console.error(error.message);
    });
};

module.exports = connectDB;
