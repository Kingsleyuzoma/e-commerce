import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, amount, reference, metadata } = body;

    if (!email || !amount || amount <= 0 || !reference) {
      return NextResponse.json(
        { error: "Invalid or zero payment amount provided." },
        { status: 400 }
      );
    }

    // 1. Set your USD to NGN conversion rate (e.g., $1 = ₦1,500)
    // You can update this rate whenever needed or fetch it dynamically
    const USD_TO_NGN_RATE = 1500;

    // 2. Convert the USD grand total into Naira
    const amountInNaira = Number(amount) * USD_TO_NGN_RATE;

    // 3. Paystack expects NGN in KOBO (multiply by 100) and rounded to an integer
    const amountInKobo = Math.round(amountInNaira * 100);

    const paystackPayload = {
      email: email.trim(),
      amount: amountInKobo,
      currency: "NGN", // Explicitly telling Paystack this is Naira
      reference,
      callback_url: `${request.headers.get("origin")}/checkout/success?reference=${reference}`,
      metadata,
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack API Error Response:", data);
      return NextResponse.json(
        { error: data.message || "Paystack initialization failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error("Paystack initialization server error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}