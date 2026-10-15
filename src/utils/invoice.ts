import type { ShopOrder } from "@/redux/features/orders/orderApi";

const formatDeliveryType = (type?: string) => {
  return type?.toLowerCase() === "express" ? "Express Delivery" : "Standard Delivery";
};

/**
 * Escapes characters for PDF string literals.
 * In WinAnsiEncoding:
 * - \243 produces the pound symbol £
 */
const escapePdfText = (str: string): string => {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/£/g, "\\243")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
};

const calcTextWidth = (text: string, fontSize: number, isBold = false): number => {
  const charWidth = fontSize * (isBold ? 0.58 : 0.52);
  return text.length * charWidth;
};

/**
 * Generates a high-fidelity standard A4 PDF (PDF 1.4) invoice
 * that visually matches the InvoiceModal component.
 */
export const generateInvoicePdfBlob = (order: ShopOrder): Blob => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;

  const orderNum = order.orderNumber || order.id || "N/A";
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const customerName = order.customer?.name || "Valued Customer";
  const customerPhone = order.customer?.phone || "—";
  const customerEmail = order.customer?.email || "—";
  const customerLoc = order.customer?.location || "No address specified";

  const rawStatus = (order.status || "pending").toLowerCase();
  const deliveryLabel = formatDeliveryType(order.deliveryType);

  const subtotal = Number(order.subtotal || 0).toFixed(2);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total ?? order.subtotal ?? 0).toFixed(2);

  const streamLines: string[] = [];

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill?: [number, number, number],
    stroke?: [number, number, number],
    lineWidth = 1
  ) => {
    if (stroke) {
      streamLines.push(`${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG ${lineWidth} w`);
    }
    if (fill && stroke) {
      streamLines.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg`);
      streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
    } else if (fill) {
      streamLines.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg`);
      streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    } else if (stroke) {
      streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
  };

  const drawHLine = (
    x1: number,
    x2: number,
    y: number,
    stroke: [number, number, number],
    lineWidth = 0.75
  ) => {
    streamLines.push(`${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG ${lineWidth} w`);
    streamLines.push(`${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`);
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    font: "/F1" | "/F2",
    size: number,
    color: [number, number, number]
  ) => {
    streamLines.push("BT");
    streamLines.push(`${font} ${size} Tf`);
    streamLines.push(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`);
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    streamLines.push(`(${escapePdfText(text)}) Tj`);
    streamLines.push("ET");
  };

  // Outer container border (Matches modal container)
  const outerX = margin;
  const outerY = 40;
  const outerW = contentWidth;
  const outerH = pageHeight - 80;
  drawRect(outerX, outerY, outerW, outerH, [1, 1, 1], [0.91, 0.91, 0.91], 1);

  const innerLeft = outerX + 22;
  const innerRight = outerX + outerW - 22;
  const innerWidth = innerRight - innerLeft;

  // 1. Header Section
  const topY = outerY + outerH - 35;

  // Left Brand Title & Subtitles
  drawText("BRITISH SMOKES", innerLeft, topY, "/F2", 20, [0.102, 0.102, 0.102]);
  drawText("Official Order Invoice & Receipt", innerLeft, topY - 16, "/F1", 9, [0.42, 0.447, 0.502]);
  drawText("United Kingdom  ·  Support: support@britishsmokes.com", innerLeft, topY - 29, "/F1", 8, [0.61, 0.64, 0.69]);

  // Right "INVOICE" Title
  const invoiceTitleW = calcTextWidth("INVOICE", 20, true);
  drawText("INVOICE", innerRight - invoiceTitleW, topY, "/F2", 20, [0.749, 0.553, 0.184]);

  // Status Badge (Pill)
  const statusLabel = "Status:";
  const statusLabelW = calcTextWidth(statusLabel, 8.5);
  const pillW = 68;
  const pillH = 15;
  const pillX = innerRight - pillW;
  const pillY = topY - 28;

  drawText(statusLabel, pillX - statusLabelW - 6, topY - 24, "/F1", 8.5, [0.42, 0.447, 0.502]);

  let statusText = "Pending";
  let pillBg: [number, number, number] = [0.996, 0.953, 0.780];
  let pillBorder: [number, number, number] = [0.992, 0.902, 0.541];
  let pillColor: [number, number, number] = [0.573, 0.251, 0.055];

  if (rawStatus === "delivered") {
    statusText = "Delivered";
    pillBg = [0.871, 0.969, 0.925];
    pillBorder = [0.737, 0.941, 0.855];
    pillColor = [0.012, 0.329, 0.247];
  } else if (rawStatus === "on_the_way") {
    statusText = "On The Way";
    pillBg = [0.882, 0.937, 0.996];
    pillBorder = [0.702, 0.808, 0.961];
    pillColor = [0.118, 0.259, 0.624];
  }

  drawRect(pillX, pillY, pillW, pillH, pillBg, pillBorder, 0.75);
  const stTextW = calcTextWidth(statusText, 7.5, true);
  drawText(statusText, pillX + (pillW - stTextW) / 2, pillY + 4, "/F2", 7.5, pillColor);

  // Divider under Header
  const headerDivY = topY - 42;
  drawHLine(innerLeft, innerRight, headerDivY, [0.898, 0.906, 0.922], 0.75);

  // 2. Invoice Meta Bar
  const metaY = headerDivY - 16;
  drawText(`Invoice Number: #${orderNum}`, innerLeft, metaY, "/F2", 9, [0.102, 0.102, 0.102]);
  const dateStrText = `Order Date: ${orderDate}`;
  const dateStrW = calcTextWidth(dateStrText, 9, true);
  drawText(dateStrText, innerRight - dateStrW, metaY, "/F2", 9, [0.102, 0.102, 0.102]);

  // 3. Two Side-by-Side Detail Cards
  const cardGap = 14;
  const cardWidth = (innerWidth - cardGap) / 2;
  const cardHeight = 116;
  const cardY = metaY - 14 - cardHeight;

  const leftCardX = innerLeft;
  const rightCardX = innerLeft + cardWidth + cardGap;

  // Card 1: Billed & Delivered To
  drawRect(leftCardX, cardY, cardWidth, cardHeight, [0.98, 0.98, 0.973], [0.898, 0.906, 0.922], 0.75);
  drawText("BILLED & DELIVERED TO", leftCardX + 12, cardY + cardHeight - 16, "/F2", 8, [0.749, 0.553, 0.184]);
  drawText(customerName, leftCardX + 12, cardY + cardHeight - 32, "/F2", 9.5, [0.067, 0.094, 0.153]);
  drawText(`Phone: ${customerPhone}`, leftCardX + 12, cardY + cardHeight - 46, "/F1", 8, [0.35, 0.35, 0.35]);
  drawText(`Email: ${customerEmail}`, leftCardX + 12, cardY + cardHeight - 58, "/F1", 8, [0.35, 0.35, 0.35]);

  drawHLine(leftCardX + 12, leftCardX + cardWidth - 12, cardY + cardHeight - 68, [0.88, 0.88, 0.88], 0.5);
  drawText("SHIPPING LOCATION", leftCardX + 12, cardY + cardHeight - 78, "/F2", 6.5, [0.61, 0.64, 0.69]);

  const locLine1 = customerLoc.length > 42 ? customerLoc.slice(0, 40) + "..." : customerLoc;
  drawText(locLine1, leftCardX + 12, cardY + cardHeight - 91, "/F1", 7.5, [0.102, 0.102, 0.102]);

  // Card 2: Shipping & Dispatch
  drawRect(rightCardX, cardY, cardWidth, cardHeight, [0.98, 0.98, 0.973], [0.898, 0.906, 0.922], 0.75);
  drawText("SHIPPING & DISPATCH", rightCardX + 12, cardY + cardHeight - 16, "/F2", 8, [0.749, 0.553, 0.184]);

  const delivTypeW = calcTextWidth(deliveryLabel, 8, true);
  drawText(deliveryLabel, rightCardX + cardWidth - 12 - delivTypeW, cardY + cardHeight - 16, "/F2", 8, [0.29, 0.33, 0.39]);

  if (order.shippingInfo) {
    const carrier = order.shippingInfo.company || "Royal Mail";
    const carrierW = calcTextWidth(carrier, 8, true);
    drawText("Carrier / Company:", rightCardX + 12, cardY + cardHeight - 36, "/F1", 8, [0.45, 0.45, 0.45]);
    drawText(carrier, rightCardX + cardWidth - 12 - carrierW, cardY + cardHeight - 36, "/F2", 8, [0.102, 0.102, 0.102]);

    drawHLine(rightCardX + 12, rightCardX + cardWidth - 12, cardY + cardHeight - 43, [0.88, 0.88, 0.88], 0.5);

    const trackingId = order.shippingInfo.trackingId || "—";
    const trackW = calcTextWidth(`#${trackingId}`, 8, true);
    drawText("Tracking Number:", rightCardX + 12, cardY + cardHeight - 57, "/F1", 8, [0.45, 0.45, 0.45]);
    drawText(`#${trackingId}`, rightCardX + cardWidth - 12 - trackW, cardY + cardHeight - 57, "/F2", 8, [0.102, 0.102, 0.102]);

    drawHLine(rightCardX + 12, rightCardX + cardWidth - 12, cardY + cardHeight - 64, [0.88, 0.88, 0.88], 0.5);

    const shipDateStr = order.shippingInfo.shippingDate
      ? new Date(order.shippingInfo.shippingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "—";
    const shipDateW = calcTextWidth(shipDateStr, 8);
    drawText("Shipped Date:", rightCardX + 12, cardY + cardHeight - 78, "/F1", 8, [0.45, 0.45, 0.45]);
    drawText(shipDateStr, rightCardX + cardWidth - 12 - shipDateW, cardY + cardHeight - 78, "/F1", 8, [0.20, 0.20, 0.20]);

    drawHLine(rightCardX + 12, rightCardX + cardWidth - 12, cardY + cardHeight - 85, [0.88, 0.88, 0.88], 0.5);

    const estDateStr = order.shippingInfo.estimatedDeliveryDate
      ? new Date(order.shippingInfo.estimatedDeliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "—";
    const estDateW = calcTextWidth(estDateStr, 8, true);
    drawText("Est. Delivery:", rightCardX + 12, cardY + cardHeight - 99, "/F1", 8, [0.45, 0.45, 0.45]);
    drawText(estDateStr, rightCardX + cardWidth - 12 - estDateW, cardY + cardHeight - 99, "/F2", 8, [0.012, 0.329, 0.247]);
  } else {
    drawText("Awaiting Dispatch", rightCardX + 65, cardY + cardHeight - 52, "/F2", 9, [0.35, 0.35, 0.35]);
    drawText("Carrier tracking details will be assigned upon dispatch.", rightCardX + 15, cardY + cardHeight - 68, "/F1", 7.5, [0.55, 0.55, 0.55]);
  }

  // 4. Items Table
  const tableTopY = cardY - 18;
  const headerHeight = 22;
  drawRect(innerLeft, tableTopY - headerHeight, innerWidth, headerHeight, [0.102, 0.102, 0.102]);

  drawText("ITEM DESCRIPTION", innerLeft + 12, tableTopY - 15, "/F2", 7.5, [1, 1, 1]);
  drawText("QTY", innerLeft + 270, tableTopY - 15, "/F2", 7.5, [1, 1, 1]);
  drawText("UNIT PRICE", innerLeft + 340, tableTopY - 15, "/F2", 7.5, [1, 1, 1]);
  const totalHeaderW = calcTextWidth("TOTAL", 7.5, true);
  drawText("TOTAL", innerRight - 12 - totalHeaderW, tableTopY - 15, "/F2", 7.5, [1, 1, 1]);

  let currentY = tableTopY - headerHeight;
  const items = order.items || [];
  let isRowAlt = false;

  for (const item of items) {
    const rowH = 24;
    currentY -= rowH;

    const rowBg: [number, number, number] = isRowAlt ? [0.975, 0.980, 0.985] : [1, 1, 1];
    isRowAlt = !isRowAlt;

    drawRect(innerLeft, currentY, innerWidth, rowH, rowBg);
    drawHLine(innerLeft, innerRight, currentY, [0.898, 0.906, 0.922], 0.5);

    const rawName = item.name || "Product";
    const displayName = rawName.length > 40 ? rawName.slice(0, 38) + "..." : rawName;
    drawText(displayName, innerLeft + 12, currentY + 7, "/F2", 8, [0.067, 0.094, 0.153]);

    const qtyStr = String(item.qty || 1);
    drawText(qtyStr, innerLeft + 275, currentY + 7, "/F1", 8, [0.29, 0.33, 0.39]);

    const unitPriceStr = `£${Number(item.price || 0).toFixed(2)}`;
    drawText(unitPriceStr, innerLeft + 345, currentY + 7, "/F1", 8, [0.29, 0.33, 0.39]);

    const lineTotalStr = `£${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}`;
    const lineTotalW = calcTextWidth(lineTotalStr, 8, true);
    drawText(lineTotalStr, innerRight - 12 - lineTotalW, currentY + 7, "/F2", 8, [0.067, 0.094, 0.153]);
  }

  // 5. Pricing Totals Card (Right Aligned)
  const totalsCardW = 215;
  const totalsCardH = 82;
  const totalsX = innerRight - totalsCardW;
  const totalsY = currentY - 14 - totalsCardH;

  drawRect(totalsX, totalsY, totalsCardW, totalsCardH, [0.98, 0.98, 0.973], [0.898, 0.906, 0.922], 0.75);

  // Subtotal
  drawText("Subtotal:", totalsX + 12, totalsY + totalsCardH - 16, "/F1", 8, [0.38, 0.42, 0.47]);
  const subtotalVal = `£${subtotal}`;
  const subValW = calcTextWidth(subtotalVal, 8, true);
  drawText(subtotalVal, totalsX + totalsCardW - 12 - subValW, totalsY + totalsCardH - 16, "/F2", 8, [0.067, 0.094, 0.153]);

  // Delivery Fee
  const delivFeeLabel = `Delivery Fee (${deliveryLabel}):`;
  drawText(delivFeeLabel, totalsX + 12, totalsY + totalsCardH - 30, "/F1", 7.5, [0.38, 0.42, 0.47]);
  const delivFeeVal = deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Free";
  const delFeeValW = calcTextWidth(delivFeeVal, 8, true);
  drawText(delivFeeVal, totalsX + totalsCardW - 12 - delFeeValW, totalsY + totalsCardH - 30, "/F2", 8, [0.067, 0.094, 0.153]);

  // Divider line
  drawHLine(totalsX + 12, totalsX + totalsCardW - 12, totalsY + totalsCardH - 38, [0.85, 0.85, 0.85], 0.5);

  // Total Amount
  drawText("Total Amount:", totalsX + 12, totalsY + totalsCardH - 53, "/F2", 9, [0.067, 0.094, 0.153]);
  const totalVal = `£${total}`;
  const totalValW = calcTextWidth(totalVal, 11, true);
  drawText(totalVal, totalsX + totalsCardW - 12 - totalValW, totalsY + totalsCardH - 54, "/F2", 11, [0.749, 0.553, 0.184]);

  // Paid at badge
  if (order.paidAt) {
    const paidDate = new Date(order.paidAt).toLocaleDateString("en-GB");
    const paidStr = `Paid on ${paidDate}`;
    const paidW = calcTextWidth(paidStr, 7.5, true);
    drawText(paidStr, totalsX + totalsCardW - 12 - paidW, totalsY + totalsCardH - 69, "/F2", 7.5, [0.012, 0.329, 0.247]);
  }

  // 6. Footer Note
  const footerY = outerY + 25;
  drawHLine(innerLeft, innerRight, footerY + 14, [0.898, 0.906, 0.922], 0.75);

  const footerText = "Thank you for your order with British Smokes!";
  const footerTextW = calcTextWidth(footerText, 8.5, true);
  drawText(footerText, innerLeft + (innerWidth - footerTextW) / 2, footerY, "/F2", 8.5, [0.42, 0.447, 0.502]);

  const streamContent = streamLines.join("\n");
  const streamLength = streamContent.length;

  const pdfParts = [
    "%PDF-1.4\n",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  // Calculate xref offsets
  let offset = 0;
  const offsets: number[] = [0];
  for (const part of pdfParts) {
    offset += part.length;
    offsets.push(offset);
  }

  const xref = [
    "xref\n",
    `0 ${pdfParts.length + 1}\n`,
    "0000000000 65535 f \n",
  ];

  for (let i = 0; i < pdfParts.length; i++) {
    const o = offsets[i];
    xref.push(`${String(o).padStart(10, "0")} 00000 n \n`);
  }

  const startXref = offset;
  const trailer = `trailer\n<< /Size ${pdfParts.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const fullPdf = pdfParts.join("") + xref.join("") + trailer;
  return new Blob([fullPdf], { type: "application/pdf" });
};

/**
 * Downloads the invoice for an order.
 * Generates the fresh, modern PDF document directly to match the InvoiceModal layout.
 */
export const downloadInvoicePdf = async (order: ShopOrder): Promise<void> => {
  const filename = `Invoice-${order.orderNumber || order.id || "order"}.pdf`;
  const blob = generateInvoicePdfBlob(order);
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
};

/**
 * Opens the modern invoice PDF directly in a new browser tab for viewing.
 */
export const viewInvoicePdf = async (order: ShopOrder): Promise<void> => {
  const blob = generateInvoicePdfBlob(order);
  const blobUrl = window.URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
};
