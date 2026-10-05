import crypto from "crypto";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      name,
      father,
      mother,
      age,
      gender,
      email,
      phone,
      instagram,
      address,
      youtube,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    if (
      !name ||
      !father ||
      !mother ||
      !age ||
      !gender ||
      !email ||
      !phone ||
      !address ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        error: "Required application or payment details are missing."
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: "Razorpay secret is not configured."
      });
    }

    if (!resendApiKey) {
      return res.status(500).json({
        success: false,
        error: "Resend API key is not configured."
      });
    }

    // Verify Razorpay payment signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed."
      });
    }

    // Generate application ID
    const applicationId =
      "VFKK-" +
      new Date().getFullYear() +
      "-" +
      Date.now().toString().slice(-6);

    // Create PDF
    const doc = new PDFDocument({
      margin: 50
    });

    const chunks = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    const pdfReady = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    doc.fontSize(22)
      .text("VASWAN FILMS", {
        align: "center"
      });

    doc.moveDown();

    doc.fontSize(18)
      .text("KON BANEGA KING", {
        align: "center"
      });

    doc.moveDown();

    doc.fontSize(14)
      .text("CASTING APPLICATION", {
        align: "center"
      });

    doc.moveDown(2);

    doc.fontSize(11);

    doc.text(`Application ID: ${applicationId}`);
    doc.text(`Application Fee: ₹199`);
    doc.text(`Payment ID: ${razorpay_payment_id}`);
    doc.text(`Order ID: ${razorpay_order_id}`);

    doc.moveDown();

    doc.text(`Full Name: ${name}`);
    doc.text(`Father's Name: ${father}`);
    doc.text(`Mother's Name: ${mother}`);
    doc.text(`Age: ${age}`);
    doc.text(`Gender: ${gender}`);
    doc.text(`Email: ${email}`);
    doc.text(`Contact Number: ${phone}`);
    doc.text(`Instagram: ${instagram || "Not provided"}`);

    doc.moveDown();

    doc.text("Address:");
    doc.text(address);

    doc.moveDown();

    doc.text(`YouTube / Intro Video: ${youtube || "Not provided"}`);

    doc.moveDown(2);

    doc.text(
      "Declaration: Applicant confirms that the information provided is correct and agrees to the casting rules."
    );

    doc.moveDown(2);

    doc.text(
      "Presented by VASWAN FILMS",
      {
        align: "center"
      }
    );

    doc.end();

    await pdfReady;

    const pdfBuffer = Buffer.concat(chunks);

    // Send email
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "VASWAN FILMS <casting@vaswanfilms.in>",
      to: [
  "comadykrishna4@gmail.com",
  "Vaswankrishna@gmail.com"
],
      subject: `Kon Banega King - Application ${applicationId}`,
      html: `
        <h2>New Kon Banega King Casting Application</h2>

        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
        <p><strong>Application Fee:</strong> ₹199</p>

        <p>
          The complete casting application PDF is attached to this email.
        </p>
      `,
      attachments: [
        {
          filename: `${applicationId}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    if (error) {
      console.error("Resend Error:", error);

      return res.status(500).json({
        success: false,
        error: "Application created but email could not be sent."
      });
    }

    return res.status(200).json({
      success: true,
      application_id: applicationId,
      payment_id: razorpay_payment_id,
      message: "Application PDF created and email sent successfully."
    });

  } catch (error) {
    console.error("Application Error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to create application."
    });
  }
      }
