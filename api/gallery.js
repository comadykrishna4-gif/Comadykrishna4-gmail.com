import crypto from "crypto";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

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

    const searchUrl =
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

    const expression =
      'folder="vaswan-films/gallery"';

    const body = {
      expression: expression,
      max_results: 100,
      sort_by: [
        {
          created_at: "desc"
        }
      ]
    };

    const auth =
      Buffer
        .from(`${apiKey}:${apiSecret}`)
        .toString("base64");

    const response =
      await fetch(searchUrl, {
        method: "POST",

        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify(body)
      });

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        "Cloudinary Search Error:",
        data
      );

      return res.status(500).json({
        success: false,
        error: "Could not load gallery."
      });
    }

    const resources =
      (data.resources || []).map((item) => {

        return {
          url: item.secure_url,
          type: item.resource_type,
          width: item.width,
          height: item.height,
          created_at: item.created_at
        };

      });

    return res.status(200).json({
      success: true,
      items: resources
    });

  } catch (error) {

    console.error(
      "Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Gallery loading failed."
    });

  }

}
