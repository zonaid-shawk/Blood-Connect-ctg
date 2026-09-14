require("dotenv").config();

const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

let cachedTransporter = null;

function hasSmtpConfig() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();

  return Boolean(
    host &&
    user &&
    pass &&
    !host.includes("your-email") &&
    !user.includes("your-email"),
  );
}

async function getTransporter() {
  if (hasSmtpConfig()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (!cachedTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html }) {
  if (!hasSmtpConfig()) {
    const message =
      "SMTP is not configured for real email delivery. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env using a Gmail App Password.";
    throw new Error(message);
  }

  const transporter = await getTransporter();

  const mailOptions = {
    from:
      process.env.SMTP_FROM || '"BloodConnect" <noreply@bloodconnect.local>',
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", smtpConfigured: hasSmtpConfig() });
});

app.get("/api/email-status", (req, res) => {
  res.json({
    smtpConfigured: hasSmtpConfig(),
    message: hasSmtpConfig()
      ? "Real SMTP is configured."
      : "SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS in .env.",
  });
});

app.post("/api/test-email", async (req, res) => {
  const { recipientEmail } = req.body || {};

  if (!recipientEmail) {
    return res.status(400).json({
      success: false,
      message: "Missing recipientEmail in request body.",
    });
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: "BloodConnect SMTP Test",
      text: "This is a test email from the BloodConnect app.",
      html: "<p>This is a test email from the BloodConnect app.</p>",
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error && error.message ? error.message : "SMTP test failed.";
    console.error("SMTP test email failed:", error);
    return res.status(500).json({ success: false, message });
  }
});

app.post("/api/send-donor-approval", async (req, res) => {
  const { recipientEmail, donorName, donorId, bloodGroup, printLink } =
    req.body || {};

  if (!recipientEmail) {
    return res
      .status(400)
      .json({ success: false, message: "Missing recipient email" });
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: "Your donor registration has been approved",
      text:
        `Hello ${donorName || "Donor"},\n\n` +
        "Congratulations! Your donor registration has been approved.\n\n" +
        `Donor ID: ${donorId || "N/A"}\n` +
        `Blood Group: ${bloodGroup || "N/A"}\n\n` +
        `Print your approval slip here: ${printLink || "N/A"}\n\n` +
        "Thank you for being a lifesaving donor.",
      html: `
        <h2>Donor Registration Approved</h2>
        <p>Hello ${donorName || "Donor"},</p>
        <p>Congratulations! Your donor registration has been approved.</p>
        <p><strong>Donor ID:</strong> ${donorId || "N/A"}</p>
        <p><strong>Blood Group:</strong> ${bloodGroup || "N/A"}</p>
        <p><a href="${printLink || "#"}">Print your donor slip</a></p>
        <p>Thank you for being a lifesaving donor.</p>
      `,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error && error.message ? error.message : "Failed to send email.";

    console.error("Donor approval email failed:", error);
    return res.status(500).json({ success: false, message });
  }
});

app.post("/api/send-blood-request", async (req, res) => {
  const {
    recipientEmail,
    patientName,
    requestId,
    bloodGroup,
    hospital,
    city,
    urgency,
  } = req.body || {};

  if (!recipientEmail) {
    return res
      .status(400)
      .json({ success: false, message: "Missing recipient email" });
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: "Blood request submitted successfully",
      text:
        `Hello ${patientName || "Patient"},\n\n` +
        "Your blood request has been submitted successfully.\n\n" +
        `Request ID: ${requestId || "N/A"}\n` +
        `Blood Group: ${bloodGroup || "N/A"}\n` +
        `Hospital: ${hospital || "N/A"}\n` +
        `City: ${city || "N/A"}\n` +
        `Urgency: ${urgency || "N/A"}\n\n` +
        "Please keep this ID for follow-up.",
      html: `
        <h2>Blood Request Submitted</h2>
        <p>Hello ${patientName || "Patient"},</p>
        <p>Your blood request has been submitted successfully.</p>
        <p><strong>Request ID:</strong> ${requestId || "N/A"}</p>
        <p><strong>Blood Group:</strong> ${bloodGroup || "N/A"}</p>
        <p><strong>Hospital:</strong> ${hospital || "N/A"}</p>
        <p><strong>City:</strong> ${city || "N/A"}</p>
        <p><strong>Urgency:</strong> ${urgency || "N/A"}</p>
        <p>Please keep this ID for follow-up.</p>
      `,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error && error.message ? error.message : "Failed to send email.";

    console.error("Blood request email failed:", error);
    return res.status(500).json({ success: false, message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`BloodConnect server running on http://localhost:${PORT}`);
  if (hasSmtpConfig()) {
    console.log("Real SMTP is configured for production email delivery.");
  } else {
    console.log(
      "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real delivery.",
    );
  }
});
