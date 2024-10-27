const globalErrors = (error, req, res, next) => {
  const message = error.message;
  const statusCode = error.statusCode || 500;
  const statusError = error.status || "Error";
  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status: statusError,
      code: statusCode,
      message,
      stack: error.stack,
    });
  } else {
    return res.status(statusCode).json({
      status: statusError,
      code: statusCode,
      message,
    });
  }
};

module.exports = globalErrors;
