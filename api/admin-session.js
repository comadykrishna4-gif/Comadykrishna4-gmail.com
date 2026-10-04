import crypto from "crypto";

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

    const token = crypto
      .createHash("sha256")
      .update(
        `${adminPassword}:${Date.now()}:${process.env.VERCEL_URL || "vaswanfilms"}`
      )
      .digest("hex");

    res.setHeader(
      "Set-Cookie",
      `vf_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("Admin Session Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
}
