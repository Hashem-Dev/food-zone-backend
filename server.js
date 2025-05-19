// server.js
const cluster = require("cluster");
const os = require("os");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });

const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const compression = require("compression");

const globalErrors = require("./services/global-errors");
const connectDB = require("./config/database-config");
const locale = require("./config/locale-config");
const cors = require("./config/cors-config");
const ApiErrors = require("./utils/api-errors");

// عدد النوى
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // إنشاء Worker لكل نواة
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // في حال توقف Worker، نعيد تشغيله
  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `Worker ${worker.process.pid} died (${signal || code}). Forking a new one...`
    );
    cluster.fork();
  });
} else {
  // كود الـ Worker: هنا ننشئ تطبيق Express فعلياً
  const app = express();
  const port = process.env.PORT || 5000;
  const api = process.env.API;

  // Middleware
  app.use(compression({ threshold: "1kb" }));
  app.use(express.json());
  app.use(cors);

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Localization
  app.use(locale.localization);
  app.use(locale.serverLanguage);

  /** @Connect to MongoDB + start server */
  connectDB(() => {
    app.listen(port, () => {
      console.log(
        `Worker ${process.pid} started in ${process.env.NODE_ENV || "production"} mode on port ${port}`
      );
    });
  });

  /** @Routes */
  app.use(`${api}/admin`, require("./routes/admin"));
  app.use(`${api}/users`, require("./routes/user"));
  app.use(`${api}/address`, require("./routes/address"));
  app.use(`${api}/restaurant`, require("./routes/restaurant"));
  app.use(`${api}/category`, require("./routes/category"));
  app.use(`${api}/meal`, require("./routes/meal"));
  app.use(`${api}/token`, require("./routes/token"));
  app.use(`${api}/reviews`, require("./routes/reviews"));
  app.use(`${api}/notification`, require("./routes/notifications"));
  app.use(`${api}/payment`, require("./routes/payment"));
  app.use(`${api}/order`, require("./routes/order"));
  app.use(`${api}/promotion`, require("./routes/promotion"));
  app.use(`${api}/search`, require("./routes/search"));

  /** Multer errors */
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return next(new ApiErrors(err.message, 400));
    }
    next(err);
  });

  /** 404 for unknown routes */
  app.all("*", (req, res, next) => {
    next(new ApiErrors(`Cannot find ${req.originalUrl}`, 404));
  });

  /** Global error handler */
  app.use(globalErrors);

  /** Process-level handlers (optional) */
  process.on("uncaughtException", (err) => {
    console.error("Unhandled Exception in worker", process.pid, err);
    process.exit(1); // worker will be respawned by master
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection in worker", process.pid, reason);
    process.exit(1);
  });
}
