import crypto from "crypto";

function createToken(password) {
  const expires = Date.now() + 60 * 60 * 1000;

  const data = `admin:${expires}`;

  const signature = crypto
    .createHmac("sha256", password)
    .update(data)
    .digest("hex");

  return Buffer.from(`${data}:${signature}`).toString("base64url");
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({
        success: false,
        error: "Admin password is not configured."
      });
    }

    if (!password || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password."
      });
    }

    const token = createToken(adminPassword);

    res.setHeader(
      "Set-Cookie",
      `vf_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful."
    });

  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
}
