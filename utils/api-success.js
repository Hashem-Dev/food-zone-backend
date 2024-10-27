class ApiSuccess {
  constructor(message) {
    this.message = message;
    this.status = "Success";
    this.statusCode = 200;
  }
}

module.exports = ApiSuccess;
