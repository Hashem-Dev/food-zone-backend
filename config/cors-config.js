const cors = require("cors");
const ApiErrors = require("../utils/api-errors");

const whitelist = ["http://localhost:5000/"];

corsOptions = {
  origin: function (origin, cb, next) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      cb(null, true);
    } else {
      cb(new ApiErrors("Invalid origin", 403));
    }
  },
  methods: "GET,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

module.exports = cors(corsOptions);
