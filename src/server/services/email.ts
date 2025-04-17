import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendInvoiceEmailParams {
  to: string;
  invoice_number: string;
  organization_name: string;
  amount: number;
  feed_name?: string;
  pdf_buffer: Buffer;
}

export async function sendInvoiceEmail({
  to,
  invoice_number,
  organization_name,
  feed_name,
  amount,
  pdf_buffer,
}: SendInvoiceEmailParams): Promise<void> {
  const mail_options = {
    from: process.env.EMAIL_FROM ?? "billing@yourcompany.com",
    to,
    subject: `Invoice ${invoice_number} for ${organization_name}`,
    text: `Please find attached invoice ${invoice_number} for your subscription ${feed_name ? `(${feed_name})` : ""}`,
    html: `
      <h2>Invoice ${invoice_number}</h2>
      <p>Dear ${organization_name},</p>
      <p>Please find attached your invoice for ${feed_name ? `(${feed_name})` : ""} for $${amount.toFixed(2)}.</p>
      <p>Thank you for your business!</p>
    `,
    attachments: [
      {
        filename: `invoice-${invoice_number}.pdf`,
        content: pdf_buffer,
      },
    ],
  };

  try {
    await transporter.sendMail(mail_options);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send invoice email");
  }
}
