import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get SendGrid API key from server-side environment variable
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';

    console.log('SendGrid API Key Length:', apiKey ? apiKey.length : 'undefined');
    console.log('From Email:', fromEmail);

    if (!apiKey) {
      console.error('SendGrid API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'SendGrid API key not configured. Please set SENDGRID_API_KEY in Vercel environment variables.'
      });
    }

    // Initialize SendGrid
    sgMail.setApiKey(apiKey);

    const { to, subject, htmlContent, textContent } = req.body;

    if (!to || !subject || (!htmlContent && !textContent)) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide: to, subject, and either htmlContent or textContent'
      });
    }

    // Prepare email message
    const msg = {
      to: to,
      from: fromEmail,
      subject: subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      html: htmlContent || textContent
    };

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