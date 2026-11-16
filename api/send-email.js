import sgMail from '@sendgrid/mail';

const NOTIFY_EMAIL = (process.env.CONTACT_NOTIFY_EMAIL || 'sage@sagerock.com').trim();
const MAX_BODY_CHARS = 50000;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get SendGrid API key from server-side environment variable
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';

    if (!apiKey) {
      console.error('SendGrid API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'SendGrid API key not configured. Please set SENDGRID_API_KEY in Vercel environment variables.'
      });
    }

    // Initialize SendGrid
    sgMail.setApiKey(apiKey);

    const { subject, htmlContent, textContent, replyTo } = req.body || {};

    if (!subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide: subject, and either htmlContent or textContent'
      });
    }

    if (
      typeof subject !== 'string' || subject.length > 300 ||
      (htmlContent && (typeof htmlContent !== 'string' || htmlContent.length > MAX_BODY_CHARS)) ||
      (textContent && (typeof textContent !== 'string' || textContent.length > MAX_BODY_CHARS))
    ) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    // This route is reachable without a login (the public contact form uses it),
    // so it never sends to an address supplied by the caller. Everything goes to
    // the site's own notification inbox. Mail to students and instructors goes
    // through the authenticated sendEmail Cloud Function instead.
    const to = NOTIFY_EMAIL;

    // Prepare email message
    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: 'AI Engagement Hub'
      },
      subject: subject.replace(/[\r\n]+/g, ' '),
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      html: htmlContent || textContent
    };

    // Add reply-to header if it is a plain email address
    if (typeof replyTo === 'string' && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(replyTo)) {
      msg.replyTo = replyTo;
    }

    console.log('📧 Sending email to:', to);
    console.log('📧 Subject:', subject);

    // Send the email
    const result = await sgMail.send(msg);

    console.log('✅ Email sent successfully:', result[0].statusCode);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      statusCode: result[0].statusCode
    });
  } catch (error) {
    console.error('SendGrid API error:', error);

    // Handle specific SendGrid errors
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
      return res.status(error.code || 500).json({
        error: 'Failed to send email',
        details: error.response.body?.errors || error.message
      });
    }

    res.status(500).json({
      error: 'Failed to send email',
      details: error.message || 'Unknown error occurred'
    });
  }
}