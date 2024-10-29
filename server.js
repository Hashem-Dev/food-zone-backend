const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const cors = require("./config/cors-config");
const connectDB = require("./config/database-config");
const locale = require("./config/locale-config");
const globalErrors = require("./services/global-errors");
const ApiErrors = require("./utils/api-errors");

const port = process.env.PORT || 5000;
const api = process.env.API;
const app = express();

/** @Routes */
const usersRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const addressRoutes = require("./routes/address");

app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(cors);

/** @language */
app.use(locale.localization);
app.use(locale.serverLanguage);

/** @Connect to MongoDB Database */
connectDB(() =>
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode");
    }
  })
);

/** @Images */
app.use(express.static(path.join(__dirname, "./uploads/avatars")));

/** @Mount routes */
app.use(`${api}/admin`, adminRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/address`, addressRoutes);

/** @ErrorHandling */

/** Multer errors */
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return next(new ApiErrors(error.message, 400));
  } else return next(error);
});

/** Route errors */
app.all("*", (req, res, next) => {
  const error = new ApiErrors(
    `Can not find this resource ${req.originalUrl}`,
    404
  );
  return next(error);
});

app.use(globalErrors);
