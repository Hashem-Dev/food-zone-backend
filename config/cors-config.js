const cors = require("cors");

const whitelist = ["http://localhost:5000"];

corsOptions = {
  origin: function (origin, cb) {
    if (whitelist.indexOf(origin) !== -1) {
      cb(null, true);
    } else {
      console.log("sdfsdf");
      cb(new Error("Not allowed by CORS"));
    }
  },
};

module.exports = cors(corsOptions);
