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

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
}
