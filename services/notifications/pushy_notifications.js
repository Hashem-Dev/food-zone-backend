const Pushy = require("pushy");
const ApiErrors = require("../../utils/api-errors");

const pushyAPIKey = process.env.PUSHY_SECRET_API_KEY;
const pushyAPI = new Pushy(pushyAPIKey);

module.exports = {
  sendNotificationToUser,
};

async function sendNotificationToUser(title, message, deviceToken, next) {
  const data = { title: title, message: message };

  const to = deviceToken;

  const options = {
    notification: {
      badge: 1,
      sound: "ping.aiff",
      title: "Test Notification",
      body: "Hello World \u270c",
    },
  };

  pushyAPI.sendPushNotification(data, to, options, function (err, id) {
    // Log errors to console
    if (err) {
      console.log("Fatal Error", err);
      return next(
        new ApiErrors(`Failed to send notification for ${deviceToken}`),
      );
    }
    // Log success
    console.log("Push sent successfully! (ID: " + id + ")");
  });
}
