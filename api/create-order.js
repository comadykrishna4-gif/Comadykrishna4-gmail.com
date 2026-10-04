export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      name,
      email,
      phone,
      city,
      portfolio
    } = req.body || {};

    if (!name || !email || !phone || !city) {
      return res.status(400).json({
        error: "Please complete all required details."
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay environment variables are missing."
      });
    }

    const auth = Buffer
      .from(`${keyId}:${keySecret}`)
      .toString("base64");

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 19900,
          currency: "INR",
          receipt: `VF_${Date.now()}`,
          notes: {
            name,
            email,
            phone,
            city,
            portfolio: portfolio || ""
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.description ||
          "Razorpay order creation failed."
      });
    }

    return res.status(200).json({
      key_id: keyId,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency
    });

  } catch (error) {
    console.error("Razorpay Error:", error);

    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
