import { NextResponse } from "next/server";
import { getFirestore } from "@/config/firebaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ status: false, error: "Missing reference" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json(
        { status: false, message: "Payment verification failed or was declined." },
        { status: 400 }
      );
    }

    const txData = data.data;

    let metadata = txData.metadata || {};
    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    const customerInfo = metadata.customer_info || {};
    const financials = metadata.financials || { grandTotal: txData.amount / 100 };
    const cartItems = metadata.cart_items || [];

    const adminDb = getFirestore();
    const ordersRef = adminDb.collection("orders");
    
    // Check if order already saved to prevent duplicates
    const querySnapshot = await ordersRef.where("paymentReference", "==", reference).get();

    let orderNumber = "";

    if (querySnapshot.empty) {
      orderNumber = `FEMEL-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Save the order record to Firestore
      await ordersRef.add({
        orderNumber,
        userId: customerInfo.userId || null,
        createdAt: new Date(),
        status: "processing",
        paymentReference: reference,
        paymentStatus: "paid",
        customer: {
          fullName: customerInfo.fullName || txData.customer?.first_name || "Customer",
          email: customerInfo.email || txData.customer?.email || "",
          phone: customerInfo.phone || "",
          address: customerInfo.address || "",
          city: customerInfo.city || "",
          state: customerInfo.state || "",
          zipCode: customerInfo.zipCode || "",
          shippingMethod: customerInfo.shippingMethod || "standard",
        },
        items: cartItems,
        financials: financials,
      });

      // 2. Push a live notification to the admin dashboard
      const notificationsRef = adminDb.collection("notifications");
      await notificationsRef.add({
        type: "new_order",
        title: "New Order Received!",
        message: `Order ${orderNumber} was placed by ${customerInfo.fullName || "a customer"} (${financials.currency || "₦"}${financials.grandTotal?.toLocaleString() || txData.amount / 100}).`,
        link: `/admin/orders`,
        read: false,
        createdAt: new Date(),
      });
    } else {
      orderNumber = querySnapshot.docs[0].data().orderNumber;
    }

    return NextResponse.json({
      status: true,
      orderNumber,
      data: txData,
    });
  } catch (error: any) {
    console.error("Paystack server verification & Admin Firestore error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { status: false, error: error?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}