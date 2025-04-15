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
  const black = 0;
  const light_gray: [number, number, number] = [245, 245, 245]; // RGB values for light gray
  const dark_gray = 80;
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

  // Remove colored header bar and replace with minimal line
  doc.setDrawColor(black);
  doc.setLineWidth(0.5);
  doc.line(page_margin, 15, doc.internal.pageSize.width - page_margin, 15);

  // Invoice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(black);
  doc.text("INVOICE", page_margin, y + 15);
  y += 35;

  // Two Column Layout
  const col_width = (content_width - 10) / 2;
  const right_col = page_margin + col_width + 10;

  // Left Column: Invoice Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text("INVOICE DETAILS", page_margin, y);
  y += 8;

  // Invoice Info Block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(dark_gray);
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
  doc.setTextColor(black);
  doc.text("BILL TO", right_col, bill_y);
  bill_y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(dark_gray);
  doc.text(data.organization.name, right_col, bill_y);
  bill_y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(data.organization.billing_email, right_col, bill_y);

  y += 25;

  // Billing Period Box - more subtle with just a light background
  doc.setFillColor(light_gray[0], light_gray[1], light_gray[2]);
  doc.roundedRect(page_margin - 3, y - 3, content_width + 6, 30, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text("BILLING PERIOD", page_margin, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(dark_gray);
  doc.text(
    `${formatDate(data.billing_period.start_date)} to ${formatDate(data.billing_period.end_date)}`,
    page_margin,
    y + 17,
  );
  y += 40;

  // Line Items Table Header - more minimal with just a bottom border
  doc.setDrawColor(black);
  doc.setLineWidth(0.5);
  doc.line(page_margin - 3, y + 5, page_margin + content_width + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(black);
  doc.text("DESCRIPTION", page_margin + 5, y + 4);
  doc.text("AMOUNT", doc.internal.pageSize.width - page_margin - 5, y + 4, {
    align: "right",
  });
  y += 20;

  // Line Items - alternating subtle backgrounds
  data.line_items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(light_gray[0], light_gray[1], light_gray[2]);
      doc.rect(page_margin - 3, y - 6, content_width + 6, 14, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark_gray);
    doc.text(`${item.feed_name} (${item.period})`, page_margin + 5, y + 2);
    doc.setFont("helvetica", "bold");
    doc.text(
      `$${item.amount}`,
      doc.internal.pageSize.width - page_margin - 5,
      y + 2,
      { align: "right" },
    );
    y += 14;
  });

  // Total Amount - with top border
  y += 5;
  doc.setDrawColor(black);
  doc.setLineWidth(0.5);
  doc.line(
    doc.internal.pageSize.width - page_margin - 80,
    y,
    doc.internal.pageSize.width - page_margin,
    y,
  );
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text(
    `Total: $${data.total_amount.toFixed(2)}`,
    doc.internal.pageSize.width - page_margin - 5,
    y + 3,
    { align: "right" },
  );

  return Buffer.from(doc.output("arraybuffer"));
}
