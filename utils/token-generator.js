const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY_TOKEN;

const accessTokenGenerator = (payload) => {
  const accessToken = jwt.sign(
    { id: payload._id, role: payload.role, isAdmin: payload.isAdmin },
    secretKey,
    { expiresIn: "15m" }
  );
  return accessToken;
};

const refreshTokenGenerator = (payload) => {
  const refreshToken = jwt.sign(
    { id: payload._id, role: payload.role, isAdmin: payload.isAdmin },
    secretKey,
    { expiresIn: "7d" }
  );
  return refreshToken;
};

module.exports = {
  accessTokenGenerator,
  refreshTokenGenerator,
};
