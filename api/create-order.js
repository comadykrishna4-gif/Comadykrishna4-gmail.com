export default async function handler(req, res) {
  // Only POST requests are allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Get registration details
    const {
      name,
      email,
      phone,
      city,
      portfolio
    } = req.body || {};

    // Validate required fields
    if (!name || !email || !phone || !city) {
      return res.status(400).json({
        error: "Please complete all required details."
      });
    }

    // Get Razorpay credentials from Vercel Environment Variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check credentials
    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay environment variables are not configured."
      });
    }

    // Create Basic Authentication
    const auth = Buffer
      .from(`${keyId}:${keySecret}`)
      .toString("base64");

    // Create Razorpay Order
    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          amount: 19900,
          currency: "INR",
          receipt: `VF_${Date.now()}`,

          notes: {
            name: name,
            email: email,
            phone: phone,
            city: city,
            portfolio: portfolio || ""
          }
        })
      }
    );

    const order = await razorpayResponse.json();

    // Razorpay error
    if (!razorpayResponse.ok) {
      return res.status(razorpayResponse.status).json({
        error:
          order?.error?.description ||
          "Razorpay order creation failed."
      });
    }

    // Send order details to website
    return res.status(200).json({
      key_id: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {

    console.error("Razorpay Error:", error);

    return res.status(500).json({
      error: "Internal server error."
    });
  }
}
