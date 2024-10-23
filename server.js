const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("./config/cors-config");

dotenv.config({ path: "config.env" });

const port = process.env.PORT || 5000;
const databaseUrl = process.env.DB_URL;

const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors);
console.log("sdfsdf://");

mongoose
  .connect(databaseUrl)
  .then((connect) => {
    console.log("Connect to database: " + connect.connection.name);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
  });

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello, World!" });
});
