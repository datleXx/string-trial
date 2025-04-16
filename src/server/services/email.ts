import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY is not set. Emails will not be sent.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

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
  const msg = {
    to,
    from: process.env.EMAIL_FROM ?? "billing@yourcompany.com",
    subject: `Invoice ${invoice_number} for ${organization_name}`,
    text: `Please find attached invoice ${invoice_number} for your subscription to ${feed_name}.`,
    html: `
      <h2>Invoice ${invoice_number}</h2>
      <p>Dear ${organization_name},</p>
      <p>Please find attached your invoice for ${feed_name} for $${amount.toFixed(2)}.</p>
      <p>Thank you for your business!</p>
    `,
    attachments: [
      {
        content: pdf_buffer.toString("base64"),
        filename: `invoice-${invoice_number}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("Error sending email:", JSON.stringify(error, null, 2));
    throw new Error("Failed to send invoice email");
  }
}
