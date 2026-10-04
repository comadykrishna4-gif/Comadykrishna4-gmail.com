import crypto from "crypto";

function parseCookies(cookieHeader) {
  const cookies = {};

  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...value] = cookie.trim().split("=");

    if (key) {
      cookies[key] = value.join("=");
    }
  });

  return cookies;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({
        success: false,
        error: "Admin password is not configured."
      });
    }

    const cookies = parseCookies(
      req.headers.cookie || ""
    );

    const token = cookies.vf_admin;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated."
      });
    }

    const decoded = Buffer
      .from(token, "base64url")
      .toString("utf8");

    const parts = decoded.split(":");

    if (parts.length !== 3) {
      return res.status(401).json({
        success: false,
        error: "Invalid session."
      });
    }

    const type = parts[0];
    const expires = Number(parts[1]);
    const signature = parts[2];

    if (type !== "admin" || !expires) {
      return res.status(401).json({
        success: false,
        error: "Invalid session."
      });
    }

    if (Date.now() > expires) {
      return res.status(401).json({
        success: false,
        error: "Session expired."
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", adminPassword)
      .update(`admin:${expires}`)
      .digest("hex");

    const valid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid session."
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("Admin Check Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error."
    });
  }
}
