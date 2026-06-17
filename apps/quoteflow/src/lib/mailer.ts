import nodemailer from "nodemailer";

import { emailTemplates } from "@/lib/email-templates";
import { env } from "@/lib/env";

function getTransport() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export { emailTemplates };

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = getTransport();

  if (!transport) {
    console.info("SMTP not configured. Email skipped.", { to, subject });
    return;
  }

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendAdminNewQuoteEmail(input: {
  quoteNumber: string;
  customerName: string;
  company: string;
  serviceType: string;
  summary: string;
}) {
  await sendEmail({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: `New quote submitted: ${input.quoteNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#12212c">
        <h2 style="margin-bottom:8px">New quote submitted</h2>
        <p style="margin:0 0 12px"><strong>${input.quoteNumber}</strong> from ${input.customerName} at ${input.company}</p>
        <p style="margin:0 0 12px">Service type: ${input.serviceType}</p>
        <p style="margin:0">${input.summary}</p>
      </div>
    `,
  });
}

export async function sendCustomerQuoteConfirmationEmail(input: {
  to: string;
  quoteNumber: string;
  contactName: string;
  summary: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `We received your StanleySync request (${input.quoteNumber})`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#12212c">
        <h2 style="margin-bottom:8px">Quote request received</h2>
        <p style="margin:0 0 12px">Thanks, ${input.contactName}.</p>
        <p style="margin:0 0 12px">Your request has been logged as <strong>${input.quoteNumber}</strong>.</p>
        <p style="margin:0 0 12px">${input.summary}</p>
        <p style="margin:0">Our team will review the details and follow up with next steps.</p>
      </div>
    `,
  });
}

export async function sendTicketAssignmentEmail(input: {
  to: string;
  ticketNumber: string;
  assignee: string;
  dueDate?: string | null;
  summary: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Ticket assigned: ${input.ticketNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#12212c">
        <h2 style="margin-bottom:8px">Ticket assignment</h2>
        <p style="margin:0 0 12px">${input.assignee} has been assigned to ${input.ticketNumber}.</p>
        <p style="margin:0 0 12px">Due date: ${input.dueDate ?? "Not set"}</p>
        <p style="margin:0">${input.summary}</p>
      </div>
    `,
  });
}

export async function sendCustomerUpdateEmail(input: {
  to: string;
  subject: string;
  message: string;
}) {
  await sendEmail({
    to: input.to,
    subject: input.subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#12212c">
        <p style="margin:0;white-space:pre-line">${input.message}</p>
      </div>
    `,
  });
}
