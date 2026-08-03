
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with your API key stored in .env.local (RESEND_API_KEY)
const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, customerName, orderNumber, items, grandTotal } = body;

    if (!email || !orderNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build product rows HTML dynamically
    const itemsHtml = (items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 10px 0; font-size: 14px; color: #333;">${item.title || item.name} (x${item.quantity || 1})</td>
          <td style="padding: 10px 0; font-size: 14px; color: #333; text-align: right; font-weight: bold;">
            $${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const data = await resend.emails.send({
      from: "Store Orders <onboarding@resend.dev>", // Replace with your verified custom domain later
      to: [email],
      subject: `Order Confirmation #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #111; margin-top: 0;">Thank you for your order! 🎉</h2>
          <p style="font-size: 14px; color: #666;">Hi ${customerName || "Customer"},</p>
          <p style="font-size: 14px; color: #666;">We have received your order <strong>#${orderNumber}</strong> and are currently processing it.</p>
          
          <div style="margin: 25px 0;">
            <h3 style="font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 15px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: right; margin-top: 20px;">
            <span style="font-size: 14px; color: #666;">Grand Total: </span>
            <strong style="font-size: 18px; color: #111;">$${Number(grandTotal).toFixed(2)}</strong>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            If you have any questions, reply directly to this email or visit our contact page.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to send order email:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}