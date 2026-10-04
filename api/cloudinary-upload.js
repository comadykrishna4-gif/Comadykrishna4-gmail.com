import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "crc8eorv",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function parseCookies(cookieHeader) {

  const cookies = {};

  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {

    const [key, ...value] =
      cookie.trim().split("=");

    if (key) {
      cookies[key] =
        value.join("=");
    }

  });

  return cookies;
}


function checkAdmin(req) {

  const adminPassword =
    process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const cookies =
    parseCookies(
      req.headers.cookie || ""
    );

  const token =
    cookies.vf_admin;

  if (!token) {
    return false;
  }

  try {

    const decoded =
      Buffer
        .from(token, "base64url")
        .toString("utf8");

    const parts =
      decoded.split(":");

    if (parts.length !== 3) {
      return false;
    }

    const type = parts[0];
    const expires =
      Number(parts[1]);
    const signature =
      parts[2];

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

    const crypto =
      require("crypto");

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          adminPassword
        )
        .update(
          `admin:${expires}`
        )
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


export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }


  if (!checkAdmin(req)) {

    return res.status(401).json({
      success: false,
      error:
        "Admin authentication required."
    });

  }


  try {

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body =
      Buffer.concat(chunks);


    const contentType =
      req.headers["content-type"] || "";


    if (
      !contentType.includes(
        "multipart/form-data"
      )
    ) {

      return res.status(400).json({
        success: false,
        error:
          "Please upload a file."
      });

    }


    const boundaryMatch =
      contentType.match(
        /boundary=(?:"([^"]+)"|([^;]+))/
      );


    if (!boundaryMatch) {

      return res.status(400).json({
        success: false,
        error:
          "Upload boundary missing."
      });

    }


    const boundary =
      boundaryMatch[1] ||
      boundaryMatch[2];


    const boundaryBuffer =
      Buffer.from(
        `--${boundary}`
      );


    const parts = [];

    let start = 0;

    while (true) {

      const index =
        body.indexOf(
          boundaryBuffer,
          start
        );

      if (index === -1) {
        break;
      }

      if (index > start) {
        parts.push(
          body.slice(
            start,
            index
          )
        );
      }

      start =
        index +
        boundaryBuffer.length;

    }


    let fileBuffer = null;
    let fileName = "upload";


    for (const part of parts) {

      const headerEnd =
        part.indexOf(
          Buffer.from("\r\n\r\n")
        );

      if (headerEnd === -1) {
        continue;
      }

      const headers =
        part
          .slice(0, headerEnd)
          .toString();

      const content =
        part.slice(
          headerEnd + 4
        );


      const fileMatch =
        headers.match(
          /filename="([^"]+)"/
        );

      if (fileMatch) {

        fileName =
          fileMatch[1];

        fileBuffer =
          content;

        if (
          fileBuffer
            .slice(-2)
            .toString() ===
          "\r\n"
        ) {

          fileBuffer =
            fileBuffer.slice(
              0,
              -2
            );

        }

        break;

      }

    }


    if (!fileBuffer) {

      return res.status(400).json({
        success: false,
        error:
          "No file received."
      });

    }


    const result =
      await new Promise(
        (resolve, reject) => {

          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                folder:
                  "vaswan-films/gallery",

                resource_type:
                  "auto",

                use_filename:
                  true,

                unique_filename:
                  true
              },

              (error, result) => {

                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }

              }
            );


          uploadStream.end(
            fileBuffer
          );

        }
      );


    return res.status(200).json({

      success: true,

      message:
        "Upload successful.",

      url:
        result.secure_url,

      public_id:
        result.public_id,

      resource_type:
        result.resource_type

    });


  } catch (error) {

    console.error(
      "Cloudinary Upload Error:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "Cloudinary upload failed."

    });

  }

}
