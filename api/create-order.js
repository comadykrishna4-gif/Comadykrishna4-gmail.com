import Razorpay from "razorpay";

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

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
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
    });

    return res.status(200).json({
      key_id: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("Razorpay Error:", error);

    return res.status(500).json({
      error:
        error?.error?.description ||
        error?.message ||
        "Razorpay order creation failed."
    });
  }
}
