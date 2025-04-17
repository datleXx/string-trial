import nodemailer from "nodemailer";
import { env } from "~/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST as string,
  port: parseInt(env.SMTP_PORT as string),
  secure: env.SMTP_SECURE === "true",
  auth: {
    user: env.SMTP_USER as string,
    pass: env.SMTP_PASSWORD as string,
  },
});

// Add some debug logging
console.log("SMTP Config:", {
  host: env.SMTP_HOST as string,
  port: env.SMTP_PORT as string,
  secure: env.SMTP_SECURE === "true",
  auth: { user: env.SMTP_USER as string, pass: "***" },
});

interface SendInvoiceEmailParams {
  to: string;
  invoice_number: string;
  organization_name: string;
  amount: number;
  feed_names?: string[];
  pdf_buffer: Buffer;
}

export async function sendInvoiceEmail({
  to,
  invoice_number,
  organization_name,
  feed_names,
  amount,
  pdf_buffer,
}: SendInvoiceEmailParams): Promise<void> {
  const mail_options = {
    from: process.env.EMAIL_FROM ?? "billing@yourcompany.com",
    to,
    subject: `Invoice ${invoice_number} for ${organization_name}`,
    text: `Please find attached invoice ${invoice_number} for your subscription ${feed_names ? `(${feed_names.join(", ")})` : ""}`,
    html: `
      <h2>Invoice ${invoice_number}</h2>
      <p>Dear ${organization_name},</p>
      <p>Please find attached your invoice ${feed_names ? `for (${feed_names.join(", ")})` : ""} for $${amount.toFixed(2)}.</p>
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
