const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const globalErrors = require("./services/global-errors");
const connectDB = require("./config/database-config");
const locale = require("./config/locale-config");
const cors = require("./config/cors-config");
const ApiErrors = require("./utils/api-errors");
const autoCannon = require("autocannon");

const port = process.env.PORT || 5000;
const api = process.env.API;
const app = express();

/** @Routes */
const usersRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const addressRoutes = require("./routes/address");
const categoryRoutes = require("./routes/category");
const restaurantRoutes = require("./routes/restaurant");
const mealRoutes = require("./routes/meal");
const tokenRoutes = require("./routes/token");
const reviewsRoutes = require("./routes/reviews");
const notificationsRoute = require("./routes/notifications");
const paymentRoutes = require("./routes/payment");
const ordersRoutes = require("./routes/order");
const promotionsRoutes = require("./routes/promotion");
const searchRoutes = require("./routes/search");

app.use(express.json());
app.use(cors);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/** @Language */
app.use(locale.localization);
app.use(locale.serverLanguage);
// hi

/** @Connect to MongoDB Database */
connectDB(() =>
  app.listen(port, () => {
    if (process.env.NODE_ENV === "development") {
      console.log("Start In Development Mode");
    } else {
      console.log("Start In Production Mode");
    }
  })
);

/** @Mount routes */
app.use(`${api}/admin`, adminRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/address`, addressRoutes);
app.use(`${api}/restaurant`, restaurantRoutes);
app.use(`${api}/category`, categoryRoutes);
app.use(`${api}/meal`, mealRoutes);
app.use(`${api}/token`, tokenRoutes);
app.use(`${api}/reviews`, reviewsRoutes);
app.use(`${api}/notification`, notificationsRoute);
app.use(`${api}/payment`, paymentRoutes);
app.use(`${api}/order`, ordersRoutes);
app.use(`${api}/promotion`, promotionsRoutes);
app.use(`${api}/search`, searchRoutes);

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

/** @uncaughtException */
process.on("uncaughtException", (error) => {
  console.error("Unhandled Exception:", error);
});

/** @unhandledRejection  */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
