
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // 1. Import autoTable directly

export const downloadOrderReceipt = (orderNumber: string, customer: any, cart: any[], financials: any) => {
  const doc = new jsPDF(); // No need for custom type extensions anymore!

  // --- Header styling ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("YOUR STORE RECEIPT", 14, 20);

  // --- ⏱️ Generate Full Date and Time Stamp ---
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const fullTimestamp = `${formattedDate} at ${formattedTime}`;

  // --- Order Metadata ---
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Order Number: #${orderNumber}`, 14, 28);
  doc.text(`Date Placed: ${fullTimestamp}`, 14, 33); // 🎯 UPDATED: Renders time beautifully onto the document layout

  // --- Customer & Shipping Info ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Shipping Address:", 14, 45);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(customer.fullName, 14, 51);
  doc.text(customer.address, 14, 56);
  doc.text(`${customer.city}, ${customer.state} ${customer.zipCode}`, 14, 61);
  doc.text(`Email: ${customer.email} | Phone: ${customer.phone}`, 14, 66);
  doc.text(`Shipping Method: ${customer.shippingMethod?.toUpperCase() || "STANDARD"}`, 14, 71);

  // --- Table of Items ---
  const tableColumn = ["Product Name", "Details", "Qty", "Unit Price", "Total"];
  const tableRows: any[] = [];

  cart.forEach((item) => {
    const unitPrice = item.product.salePrice || item.product.price;
    const details = [
      item.selectedColor ? `Color: ${item.selectedColor}` : "",
      item.selectedSize ? `Size: ${item.selectedSize}` : ""
    ].filter(Boolean).join(" | ") || "N/A";

    tableRows.push([
      item.product.name,
      details,
      item.quantity,
      `$${unitPrice.toFixed(2)}`,
      `$${(unitPrice * item.quantity).toFixed(2)}`
    ]);
  });

  // 2. Pass the "doc" instance as the first parameter to the imported autoTable function
  autoTable(doc, {
    startY: 78,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [17, 24, 39], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
    }
  });

  // 3. To get the final Y position dynamically:
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Subtotal:`, 130, finalY);
  doc.text(`$${financials.subtotal.toFixed(2)}`, 175, finalY, { align: "right" });

  doc.text(`Shipping:`, 130, finalY + 5);
  doc.text(`$${financials.shipping.toFixed(2)}`, 175, finalY + 5, { align: "right" });

  doc.text(`Tax:`, 130, finalY + 10);
  doc.text(`$${financials.tax.toFixed(2)}`, 175, finalY + 10, { align: "right" });

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Grand Total:`, 130, finalY + 18);
  doc.text(`$${financials.grandTotal.toFixed(2)}`, 175, finalY + 18, { align: "right" });

  // Save the generated PDF file automatically to the device
  doc.save(`Receipt_Order_${orderNumber}.pdf`);
};