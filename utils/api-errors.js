class ApiErrors extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? "Failure" : "Error";
    this.operational = statusCode >= 500 ? false : true;
  }
}

const catchErrors = (req, res, next) => {};

module.exports = ApiErrors;
