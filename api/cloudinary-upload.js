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

function checkAdmin(req) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const cookies = parseCookies(
    req.headers.cookie || ""
  );

  const token = cookies.vf_admin;

  if (!token) {
    return false;
  }

  try {

    const decoded = Buffer
      .from(token, "base64url")
      .toString("utf8");

    const parts = decoded.split(":");

    if (parts.length !== 3) {
      return false;
    }

    const type = parts[0];
    const expires = Number(parts[1]);
    const signature = parts[2];

    if (
      type !== "admin" ||
      !expires ||
      !signature
    ) {
      return false;
    }

    if (Date.now() > expires) {
      return false;
    }

    const expectedSignature =
      crypto
        .createHmac("sha256", adminPassword)
        .update(`admin:${expires}`)
        .digest("hex");

    return (
      signature.length ===
        expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    );

  } catch (error) {

    return false;

  }
}


export default function handler(req, res) {

  if (req.method !== "GET") {

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }


  if (!checkAdmin(req)) {

    return res.status(401).json({
      success: false,
      error: "Admin authentication required."
    });

  }


  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || "crc8eorv";

  const apiKey =
    process.env.CLOUDINARY_API_KEY;

  const apiSecret =
    process.env.CLOUDINARY_API_SECRET;


  if (!apiKey || !apiSecret) {

    return res.status(500).json({
      success: false,
      error: "Cloudinary environment variables are missing."
    });

  }


  const timestamp =
    Math.floor(Date.now() / 1000);


  const folder =
    "vaswan-films/gallery";


  const signatureString =
    `folder=${folder}&timestamp=${timestamp}${apiSecret}`;


  const signature =
    crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");


  return res.status(200).json({

    success: true,

    cloud_name: cloudName,

    api_key: apiKey,

    timestamp: timestamp,

    folder: folder,

    signature: signature

  });

}
