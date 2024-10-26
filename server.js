const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const express = require("express");
const morgan = require("morgan");
const cors = require("./config/cors-config");
const path = require("path");
const connectDB = require("./config/database-config");
const globalErrors = require("./services/global-errors");
const ApiErrors = require("./utils/api-errors");
const locale = require("./config/locale-config");

const port = process.env.PORT || 5000;
const api = process.env.API;
const app = express();

/** @Routes */

const usersRoutes = require("./routes/user");

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
app.use(
  `${api}/uploads/avatars/`,
  express.static(path.join(__dirname, "./uploads/avatars"))
);

/** @Mount routes */
app.use(`${api}/users`, usersRoutes);

/** @ErrorHandling */
app.all("*", (req, res, next) => {
  const error = new ApiErrors(
    `Can not find this resource ${req.originalUrl}`,
    404
  );
  return next(error);
});

app.use(globalErrors);
