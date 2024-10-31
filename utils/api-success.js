class ApiSuccess {
  constructor(message, data) {
    this.status = "Success";
    this.code = 200;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiSuccess;
