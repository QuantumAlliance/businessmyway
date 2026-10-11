import type { ShopOrder } from "@/redux/features/orders/orderApi";
import { resolveMediaUrl } from "@/utils/media";

const escapePdfText = (str: string): string => {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " "); // Keep standard ASCII for Helvetica
};

/**
 * Generates a valid standard PDF 1.4 invoice document as a Blob.
 */
export const generateInvoicePdfBlob = (order: ShopOrder): Blob => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const orderNum = order.orderNumber || order.id || "N/A";
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB");
  const customerName = order.customer?.name || "Valued Customer";
  const customerPhone = order.customer?.phone || "—";
  const customerEmail = order.customer?.email || "—";
  const customerLoc = order.customer?.location || "—";
  const status = (order.status || "completed").toUpperCase();
  const subtotal = Number(order.subtotal || 0).toFixed(2);
  const deliveryFee = Number(order.deliveryFee || 0).toFixed(2);
  const total = Number(order.total ?? order.subtotal ?? 0).toFixed(2);

  const streamLines: string[] = [];

  // Top header banner (Dark background)
  streamLines.push("0.1 0.1 0.1 rg"); // #1A1A1A
  streamLines.push(`0 ${pageHeight - 90} ${pageWidth} 90 re f`);

  // Gold accent line
  streamLines.push("0.75 0.55 0.18 rg"); // #BF8D2F
  streamLines.push(`0 ${pageHeight - 93} ${pageWidth} 3 re f`);

  // Header Text
  streamLines.push("BT");
  streamLines.push("/F2 20 Tf");
  streamLines.push("1 1 1 rg");
  streamLines.push(`${margin} ${pageHeight - 52} Td`);
  streamLines.push(`(${escapePdfText("BRITISH SMOKES")}) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F1 10 Tf");
  streamLines.push("0.8 0.8 0.8 rg");
  streamLines.push(`${margin} ${pageHeight - 70} Td`);
  streamLines.push(`(${escapePdfText("Official Order Invoice & Receipt")}) Tj`);
  streamLines.push("ET");

  // INVOICE title right-aligned
  streamLines.push("BT");
  streamLines.push("/F2 22 Tf");
  streamLines.push("0.75 0.55 0.18 rg");
  streamLines.push(`${pageWidth - margin - 110} ${pageHeight - 55} Td`);
  streamLines.push(`(INVOICE) Tj`);
  streamLines.push("ET");

  // Invoice Details box
  let currentY = pageHeight - 130;

  // Invoice Metadata
  streamLines.push("BT");
  streamLines.push("/F2 10 Tf");
  streamLines.push("0.15 0.15 0.15 rg");
  streamLines.push(`${margin} ${currentY} Td`);
  streamLines.push(`(Invoice Number:) Tj`);
  streamLines.push("/F1 10 Tf");
  streamLines.push(` ( #${escapePdfText(orderNum)}) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F2 10 Tf");
  streamLines.push("0.15 0.15 0.15 rg");
  streamLines.push(`${pageWidth - margin - 160} ${currentY} Td`);
  streamLines.push(`(Date:) Tj`);
  streamLines.push("/F1 10 Tf");
  streamLines.push(` (${escapePdfText(dateStr)}) Tj`);
  streamLines.push("ET");

  currentY -= 20;
  streamLines.push("BT");
  streamLines.push("/F2 10 Tf");
  streamLines.push("0.15 0.15 0.15 rg");
  streamLines.push(`${pageWidth - margin - 160} ${currentY} Td`);
  streamLines.push(`(Status:) Tj`);
  streamLines.push("/F2 10 Tf");
  streamLines.push("0.75 0.55 0.18 rg");
  streamLines.push(` (${escapePdfText(status)}) Tj`);
  streamLines.push("ET");

  // Customer Information Section
  currentY -= 15;
  streamLines.push("0.96 0.95 0.93 rg"); // light bg
  streamLines.push(`${margin} ${currentY - 65} ${contentWidth} 75 re f`);
  streamLines.push("0.85 0.82 0.78 RG 1 w");
  streamLines.push(`${margin} ${currentY - 65} ${contentWidth} 75 re S`);

  streamLines.push("BT");
  streamLines.push("/F2 11 Tf");
  streamLines.push("0.75 0.55 0.18 rg");
  streamLines.push(`${margin + 12} ${currentY - 12} Td`);
  streamLines.push(`(BILLED TO:) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F2 10 Tf");
  streamLines.push("0.1 0.1 0.1 rg");
  streamLines.push(`${margin + 12} ${currentY - 28} Td`);
  streamLines.push(`(${escapePdfText(customerName)}) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F1 9 Tf");
  streamLines.push("0.35 0.35 0.35 rg");
  streamLines.push(`${margin + 12} ${currentY - 42} Td`);
  streamLines.push(`(Phone: ${escapePdfText(customerPhone)}  |  Email: ${escapePdfText(customerEmail)}) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F1 9 Tf");
  streamLines.push("0.35 0.35 0.35 rg");
  streamLines.push(`${margin + 12} ${currentY - 56} Td`);
  streamLines.push(`(Delivery Address: ${escapePdfText(customerLoc)}) Tj`);
  streamLines.push("ET");

  // Items Table Header
  currentY -= 95;
  streamLines.push("0.1 0.1 0.1 rg");
  streamLines.push(`${margin} ${currentY - 20} ${contentWidth} 22 re f`);

  streamLines.push("BT");
  streamLines.push("/F2 9 Tf");
  streamLines.push("1 1 1 rg");
  streamLines.push(`${margin + 10} ${currentY - 14} Td`);
  streamLines.push(`(ITEM DESCRIPTION) Tj`);
  streamLines.push(`${contentWidth - 210} 0 Td`);
  streamLines.push(`(QTY) Tj`);
  streamLines.push(`60 0 Td`);
  streamLines.push(`(UNIT PRICE) Tj`);
  streamLines.push(`70 0 Td`);
  streamLines.push(`(TOTAL) Tj`);
  streamLines.push("ET");

  currentY -= 20;

  // Items
  const items = order.items || [];
  let rowAlt = false;

  for (const item of items) {
    currentY -= 24;
    if (rowAlt) {
      streamLines.push("0.98 0.98 0.97 rg");
      streamLines.push(`${margin} ${currentY - 4} ${contentWidth} 24 re f`);
    }
    rowAlt = !rowAlt;

    streamLines.push("0.9 0.9 0.9 RG 0.5 w");
    streamLines.push(`${margin} ${currentY - 4} m ${pageWidth - margin} ${currentY - 4} l S`);

    const itemName = item.name ? (item.name.length > 38 ? `${item.name.slice(0, 36)}...` : item.name) : "Product";
    const qty = String(item.qty || 1);
    const unitPrice = `GBP ${Number(item.price || 0).toFixed(2)}`;
    const lineTotal = `GBP ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}`;

    streamLines.push("BT");
    streamLines.push("/F1 9 Tf");
    streamLines.push("0.15 0.15 0.15 rg");
    streamLines.push(`${margin + 10} ${currentY + 4} Td`);
    streamLines.push(`(${escapePdfText(itemName)}) Tj`);
    streamLines.push(`${contentWidth - 210} 0 Td`);
    streamLines.push(`(${escapePdfText(qty)}) Tj`);
    streamLines.push(`60 0 Td`);
    streamLines.push(`(${escapePdfText(unitPrice)}) Tj`);
    streamLines.push("/F2 9 Tf");
    streamLines.push(`70 0 Td`);
    streamLines.push(`(${escapePdfText(lineTotal)}) Tj`);
    streamLines.push("ET");
  }

  // Summary section
  currentY -= 35;
  const summaryX = pageWidth - margin - 200;

  // Subtotal
  streamLines.push("BT");
  streamLines.push("/F1 9 Tf");
  streamLines.push("0.35 0.35 0.35 rg");
  streamLines.push(`${summaryX} ${currentY} Td`);
  streamLines.push(`(Subtotal:) Tj`);
  streamLines.push("/F2 9 Tf");
  streamLines.push("0.1 0.1 0.1 rg");
  streamLines.push(`120 0 Td`);
  streamLines.push(`(GBP ${subtotal}) Tj`);
  streamLines.push("ET");

  // Delivery
  currentY -= 18;
  streamLines.push("BT");
  streamLines.push("/F1 9 Tf");
  streamLines.push("0.35 0.35 0.35 rg");
  streamLines.push(`${summaryX} ${currentY} Td`);
  streamLines.push(`(Delivery Fee:) Tj`);
  streamLines.push("/F2 9 Tf");
  streamLines.push("0.1 0.1 0.1 rg");
  streamLines.push(`120 0 Td`);
  streamLines.push(`(GBP ${deliveryFee}) Tj`);
  streamLines.push("ET");

  // Divider
  currentY -= 10;
  streamLines.push("0.8 0.8 0.8 RG 1 w");
  streamLines.push(`${summaryX} ${currentY} m ${pageWidth - margin} ${currentY} l S`);

  // Total
  currentY -= 20;
  streamLines.push("BT");
  streamLines.push("/F2 12 Tf");
  streamLines.push("0.75 0.55 0.18 rg");
  streamLines.push(`${summaryX} ${currentY} Td`);
  streamLines.push(`(Total Amount:) Tj`);
  streamLines.push(`100 0 Td`);
  streamLines.push(`(GBP ${total}) Tj`);
  streamLines.push("ET");

  // Footer notes
  streamLines.push("0.85 0.82 0.78 RG 0.5 w");
  streamLines.push(`${margin} 80 m ${pageWidth - margin} 80 l S`);

  streamLines.push("BT");
  streamLines.push("/F2 9 Tf");
  streamLines.push("0.75 0.55 0.18 rg");
  streamLines.push(`${margin} 62 Td`);
  streamLines.push(`(Thank you for your order with British Smokes!) Tj`);
  streamLines.push("ET");

  streamLines.push("BT");
  streamLines.push("/F1 8 Tf");
  streamLines.push("0.5 0.5 0.5 rg");
  streamLines.push(`${margin} 48 Td`);
  streamLines.push(`(${escapePdfText("For inquiries regarding this order, please contact customer support.")}) Tj`);
  streamLines.push("ET");

  const streamContent = streamLines.join("\n");
  const streamLength = streamContent.length;

  const pdfParts = [
    "%PDF-1.4\n",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
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
 * If order.invoice exists, it downloads the uploaded file.
 * Otherwise, it creates a fresh PDF on the fly and downloads it.
 */
export const downloadInvoicePdf = async (order: ShopOrder): Promise<void> => {
  const filename = `Invoice-${order.orderNumber || order.id || "order"}.pdf`;

  if (order.invoice) {
    const fullUrl = resolveMediaUrl(order.invoice);
    if (fullUrl) {
      try {
        const res = await fetch(fullUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {
        // Fallback to direct navigation / download link
      }
      const a = document.createElement("a");
      a.href = fullUrl;
      a.target = "_blank";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  }

  // Fallback: generate PDF directly
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
