import { jsPDF } from "jspdf";

interface InvoiceData {
  invoice_number: string;
  organization: {
    id: string;
    name: string;
    billing_email: string;
  };
  billing_period: {
    start_date: string;
    end_date: string;
  };
  line_items: Array<{
    feed_name: string;
    amount: string;
    period: string;
  }>;
  total_amount: number;
  generated_at: string;
  due_date: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // Create a new jsPDF instance
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Define colors and constants
  const primary_color: [number, number, number] = [41, 128, 185];
  const secondary_color: [number, number, number] = [100, 100, 100];
  const background_gray = 248;
  const page_margin = 20;
  const content_width = doc.internal.pageSize.width - 2 * page_margin;

  // Helper function for date formatting
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  let y = 20;

  // Company Header Bar
  doc.setFillColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 10, "F");

  // Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(51, 51, 51);
  doc.text("INVOICE", page_margin, y + 15);
  y += 35;

  // Two Column Layout
  const col_width = (content_width - 10) / 2;
  const right_col = page_margin + col_width + 10;

  // Left Column: Invoice Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.text("INVOICE DETAILS", page_margin, y);
  y += 8;

  // Invoice Info Block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Invoice Number:`, page_margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(data.invoice_number, page_margin + 35, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`Generated:`, page_margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(data.generated_at), page_margin + 35, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`Due Date:`, page_margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(data.due_date), page_margin + 35, y);

  // Right Column: Bill To
  let bill_y = y - 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.text("BILL TO", right_col, bill_y);
  bill_y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.organization.name, right_col, bill_y);
  bill_y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(data.organization.billing_email, right_col, bill_y);

  y += 25;

  // Billing Period Box
  doc.setFillColor(background_gray, background_gray, background_gray);
  doc.roundedRect(page_margin - 3, y - 3, content_width + 6, 30, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.text("BILLING PERIOD", page_margin, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `${formatDate(data.billing_period.start_date)} to ${formatDate(data.billing_period.end_date)}`,
    page_margin,
    y + 17,
  );
  y += 40;

  // Line Items Table
  // Header
  doc.setFillColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.roundedRect(page_margin - 3, y - 3, content_width + 6, 12, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", page_margin + 5, y + 4);
  doc.text("AMOUNT", doc.internal.pageSize.width - page_margin - 5, y + 4, {
    align: "right",
  });
  y += 20;

  // Line Items
  doc.setTextColor(60, 60, 60);
  data.line_items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(background_gray, background_gray, background_gray);
      doc.roundedRect(page_margin - 3, y - 6, content_width + 6, 14, 2, 2, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.text(`${item.feed_name} (${item.period})`, page_margin + 5, y + 2);
    doc.setFont("helvetica", "bold");
    doc.text(
      `$${item.amount}`,
      doc.internal.pageSize.width - page_margin - 5,
      y + 2,
      {
        align: "right",
      },
    );
    y += 14;
  });

  // Total Amount
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primary_color[0], primary_color[1], primary_color[2]);
  doc.text(
    `Total: $${data.total_amount.toFixed(2)}`,
    doc.internal.pageSize.width - page_margin - 5,
    y + 3,
    { align: "right" },
  );

  // Footer
  y = doc.internal.pageSize.height - 25;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(
    page_margin,
    y - 10,
    doc.internal.pageSize.width - page_margin,
    y - 10,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondary_color[0], secondary_color[1], secondary_color[2]);
  doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, y, {
    align: "center",
  });

  doc.setFontSize(8);
  y += 6;
  doc.text(
    "Payment is due within 30 days of invoice date.",
    doc.internal.pageSize.width / 2,
    y,
    { align: "center" },
  );

  return Buffer.from(doc.output("arraybuffer"));
}
