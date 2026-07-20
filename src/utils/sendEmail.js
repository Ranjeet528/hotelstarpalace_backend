import nodemailer from "nodemailer";
import dns from "dns";

const resolve4 = (hostname) =>
  new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses?.length) return reject(err || new Error("No IPv4 found"));
      resolve(addresses[0]);
    });
  });

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const ipv4Host = await resolve4("smtp.gmail.com");

  cachedTransporter = nodemailer.createTransport({
    host: ipv4Host,          // IP directly, IPv6 ka chance hi nahi
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {
      servername: "smtp.gmail.com", // TLS cert validation ke liye zaroori
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    return await transporter.sendMail({
      from: `"Star Palace Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email send failed:", error.message);
    cachedTransporter = null; // agla attempt fresh resolve kare
    return null; // throw NAHI karna — register crash nahi hona chahiye
  }
};