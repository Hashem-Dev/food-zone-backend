const nodemailer = require("nodemailer");

const otpEmail = Math.floor(100000 + Math.random() * 900000);
const otpPassword = Math.floor(100000 + Math.random() * 900000);

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: process.env.APP_SERVER_EMAIL,
    pass: process.env.APP_SERVER_PASSWORD,
  },
});
async function sendRegisterOtp(email, lang) {
  let mailOptions;

  if (lang === "ar") {
    mailOptions = {
      from: `"فود زون" <${process.env.APP_SERVER_EMAIL}>`,
      to: email,
      bcc: process.env.APP_SERVER_EMAIL,
      subject: "تأكيد البريد الإلكتروني - رمز التحقق الخاص بك",
      text: `مرحبًا!

            شكرًا لتسجيلك معنا. لإكمال عملية التسجيل، يرجى إدخال رمز التحقق التالي:

            رمز التحقق: ${otpEmail}

            إذا لم تقم بطلب هذا، يمكنك تجاهل هذه الرسالة.

            تحياتنا،
            فريق دعم فود زون`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>مرحبًا!</h2>
                <p>شكرًا لتسجيلك معنا. لإكمال عملية التسجيل، يرجى إدخال رمز التحقق التالي:</p>
                <h3 style="color: #4CAF50;">رمز التحقق: <strong>${otpEmail}</strong></h3>
                <p>إذا لم تقم بطلب هذا، يمكنك تجاهل هذه الرسالة.</p>
                <p style="margin-top: 20px;">تحياتنا,<br>فريق دعم فود زون</p>
            </div>
        `,
    };
  } else {
    mailOptions = {
      from: `"Food Zone" <${process.APP_SERVER_EMAIL}>`,
      to: email,
      bcc: process.env.APP_SERVER_EMAIL,
      subject: "Email Confirmation - Your Verification Code",
      text: `Hello!

              Thank you for registering with us. To complete the registration process, please enter the following verification code:

              Verification Code: ${otpEmail}

              If you did not request this, you can ignore this email.

              Best regards,
              Food Zone Support Team`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hello!</h2>
                <p>Thank you for registering with us. To complete the registration process, please enter the following verification code:</p>
                <h3 style="color: #4CAF50;">Verification Code: <strong>${otpEmail}</strong></h3>
                <p>If you did not request this, you can ignore this email.</p>
                <p style="margin-top: 20px;">Best regards,<br>Food Zone Support Team</p>
            </div>
        `,
    };
  }

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return console.log("Error: " + error);
    }
    console.log(`Message sent successfully to ${email}`);
  });
  return otpEmail;
}

async function sendPasswordOtp(email, lang) {
  let mailOptions;

  if (lang === "ar") {
    mailOptions = {
      from: `"فود زون" <${process.env.APP_SERVER_EMAIL}>`,
      to: email,
      bcc: process.env.APP_EMAIL,
      subject: "تغيير كلمة المرور - رمز التحقق الخاص بك",
      text: `مرحباً،

            لقد تلقينا طلباً لتغيير كلمة المرور الخاصة بك. للمتابعة، يرجى إدخال رمز التحقق التالي:

            رمز التحقق: ${otpPassword}

            إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني.

            مع أطيب التحيات،
            فريق الدعم`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
              <h2 style="color: #333;">مرحباً،</h2>
              <p>لقد تلقينا طلباً لتغيير كلمة المرور الخاصة بك. للمتابعة، يرجى إدخال رمز التحقق التالي:</p>
              <h3 style="color: #4CAF50;">رمز التحقق: <strong>${otpPassword}</strong></h3>
              <p>إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني.</p>
              <p style="margin-top: 20px;">مع أطيب التحيات,<br> فريق دعم فود زون</p>
            </div>
        `,
    };
  } else {
    mailOptions = {
      from: `"Food Zone" <${process.env.APP_EMAIL}>`,
      to: email,
      bcc: process.env.APP_EMAIL,
      subject: "Change Password Confirmation - Your Verification Code",
      text: `Hello,

            We received a request to change your password. To proceed, please enter the following verification code:

            Verification Code: ${otpPassword}

            If you did not request this, you can ignore this email.

            Best regards,
            Support Team
            `,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
              <h2 style="color: #333;">Hello,</h2>
              <p>We received a request to change your password. To proceed, please enter the following verification code:</p>
              <h3 style="color: #4CAF50;">Verification Code: <strong>${otpPassword}</strong></h3>
              <p>If you did not request this, you can ignore this email.</p>
              <p style="margin-top: 20px;">Best regards,<br>Food Zone Support Team</p>
          </div>

        `,
    };
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error: " + error);
    }
    console.log(`Message sent successfully to ${email}`);
  });
  return otpPassword;
}

async function sendEmailChangeOtp(email, lang) {
  let mailOptions;

  if (lang === "ar") {
    mailOptions = {
      from: `"فود زون" <${process.env.APP_SERVER_EMAIL}>`,
      to: email,
      bcc: process.env.APP_SERVER_EMAIL,
      subject: "تأكيد تغيير البريد الإلكتروني - رمز التحقق الخاص بك",
      text: `مرحبًا!

            لقد طلبت تغيير بريدك الإلكتروني. لتأكيد هذا التغيير، يرجى إدخال رمز التحقق التالي:

            رمز التحقق: ${otpEmail}

            إذا لم تقم بطلب هذا، يمكنك تجاهل هذه الرسالة.

            تحياتنا،
            فريق دعم فود زون`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>مرحبًا!</h2>
                <p>لقد طلبت تغيير بريدك الإلكتروني. لتأكيد هذا التغيير، يرجى إدخال رمز التحقق التالي:</p>
                <h3 style="color: #4CAF50;">رمز التحقق: <strong>${otpEmail}</strong></h3>
                <p>إذا لم تقم بطلب هذا، يمكنك تجاهل هذه الرسالة.</p>
                <p style="margin-top: 20px;">تحياتنا,<br>فريق دعم فود زون</p>
            </div>
        `,
    };
  } else {
    mailOptions = {
      from: `"Food Zone" <${process.env.APP_SERVER_EMAIL}>`,
      to: email,
      bcc: process.env.APP_SERVER_EMAIL,
      subject: "Email Change Confirmation - Your Verification Code",
      text: `Hello!

              You requested to change your email address. To confirm this change, please enter the following verification code:

              Verification Code: ${otpEmail}

              If you did not request this, you can ignore this email.

              Best regards,
              Food Zone Support Team`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Hello!</h2>
                <p>You requested to change your email address. To confirm this change, please enter the following verification code:</p>
                <h3 style="color: #4CAF50;">Verification Code: <strong>${otpEmail}</strong></h3>
                <p>If you did not request this, you can ignore this email.</p>
                <p style="margin-top: 20px;">Best regards,<br>Food Zone Support Team</p>
            </div>
        `,
    };
  }

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return console.log("Error: " + error);
    }
    console.log(`Message sent successfully to ${email}`);
  });

  return otpEmail;
}

module.exports = { sendRegisterOtp, sendPasswordOtp, sendEmailChangeOtp };
