import dotenv from "dotenv";
import sgMail from '@sendgrid/mail';
const envPath = process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send an email
export const sendEmail = async (to, subject, text, html) => {
  try {
    const msg = {
      to, // Change to your recipient
      from: process.env.EMAIL_USER, // Change to your verified sender
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log('Email sent');
    return { success: true };
  } catch (error) {
    console.error('Error sending email: ', error);
    return { success: false, error: 'Error sending email' };
  }
};

// Export the function to send reminder emails
export const sendReminderEmail = async (document) => {
  const subject = "Reminder: Action Required";
  const text = `Dear ${document.clientName}, please review your document.`;
  const html = `<p>Dear ${document.clientName},</p><p>Please review your document.</p>`;
  await sendEmail(document.clientEmail, subject, text, html);
  console.log("Reminder email sent for document:", document);
};

// Export the function to send expiration emails
export const sendExpirationEmail = async (document) => {
  const subject = "Expiration Notice";
  const text = `Dear ${document.clientName}, your document is about to expire.`;
  const html = `<p>Dear ${document.clientName},</p><p>Your document is about to expire.</p>`;
  await sendEmail(document.clientEmail, subject, text, html);
  console.log("Expiration email sent for document:", document);
};
