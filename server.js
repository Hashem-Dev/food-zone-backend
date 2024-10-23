const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const express = require("express");
const morgan = require("morgan");
const cors = require("./config/cors-config");
const connectDB = require("./config/database-config");
const globalErrors = require("./services/global-errors");
const ApiErrors = require("./utils/api-errors");
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors);

/** @Connect to MongoDB Database */
connectDB(() =>
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode");
    }
  })
);

/** @WelcomeRoute */
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello, World!" });
});

/** @ErrorHandling */

app.all("*", (req, next) => {
  const error = new ApiErrors(
    `Can not find this resource ${req.originalUrl}`,
    404
  );
  return next(error);
});
app.use(globalErrors);
