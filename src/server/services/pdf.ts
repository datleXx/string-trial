import PDFDocument from "pdfkit";

interface InvoiceData {
  invoiceNumber: string;
  organization: {
    id: string;
    name: string;
    billingEmail: string;
  };
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  lineItems: Array<{
    feedName: string;
    amount: string;
    period: string;
  }>;
  totalAmount: number;
  generatedAt: string;
  dueDate: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with default Helvetica font
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text("INVOICE", { align: "center" });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${data.invoiceNumber}`);
      doc.text(`Date: ${new Date(data.generatedAt).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`);
      doc.moveDown();

      // Organization Details
      doc.text("Bill To:");
      doc.text(data.organization.name);
      doc.text(data.organization.billingEmail);
      doc.moveDown();

      // Billing Period
      doc.text("Billing Period:");
      doc.text(
        `${new Date(data.billingPeriod.startDate).toLocaleDateString()} to ${new Date(data.billingPeriod.endDate).toLocaleDateString()}`,
      );
      doc.moveDown();

      // Line Items
      doc.text("Items:", { underline: true });
      doc.moveDown();

      data.lineItems.forEach((item) => {
        doc.text(`${item.feedName} (${item.period})`);
        doc.text(`Amount: $${item.amount}`, { align: "right" });
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.fontSize(14).text(`Total Amount: $${data.totalAmount.toFixed(2)}`, {
        align: "right",
      });

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(10)
        .text("Thank you for your business!", { align: "center" });

      doc.end();
    } catch (error) {
      reject(
        error instanceof Error ? error : new Error("Failed to generate PDF"),
      );
    }
  });
}
