require("dotenv").config();

const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

let cachedTransporter = null;

async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
  res.json({ status: "ok" });
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
    console.error("Donor approval email failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
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
    console.error("Blood request email failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`BloodConnect server running on http://localhost:${PORT}`);
  console.log(
    "Using Ethereal test SMTP by default; set SMTP_HOST/SMTP_USER/SMTP_PASS for real delivery.",
  );
});
