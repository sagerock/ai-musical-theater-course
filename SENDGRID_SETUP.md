# SendGrid Email Verification Setup

## Step 1: SendGrid Configuration in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Navigate to **Authentication** → **Settings** → **SMTP Settings**
3. Configure the following:

```
Enable custom SMTP: ✅ Enabled
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [YOUR_SENDGRID_API_KEY]
Sender Name: AI Engagement Hub
Sender Email: noreply@yourdomain.com (must be verified in SendGrid)
```

## Step 2: SendGrid Setup

1. Create account at [SendGrid.com](https://sendgrid.com)
2. Go to **Settings** → **API Keys** → **Create API Key**
3. Choose "Restricted Access" with:
   - Mail Send: Full Access
   - Template Engine: Read Access (if using templates)
4. Copy the API key to use as SMTP password in Supabase

## Step 3: Domain Verification (Production)

1. In SendGrid: **Settings** → **Sender Authentication**
2. **Authenticate Your Domain** - add your domain
3. Add DNS records provided by SendGrid
4. Update Supabase sender email to use verified domain

## Step 4: Custom Email Templates (Optional)

You can customize the email templates in Supabase:

### Email Confirmation Template
```html
<h2>Welcome to AI Engagement Hub!</h2>
<p>Hello {{.Email}},</p>
<p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
<a href="{{.ConfirmationURL}}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Confirm Email</a>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account, please ignore this email.</p>
```

### Password Reset Template  
```html
<h2>Reset Your Password</h2>
<p>Hello {{.Email}},</p>
<p>You requested a password reset for your AI Engagement Hub account.</p>
<a href="{{.ConfirmationURL}}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Reset Password</a>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## Step 5: Testing

After configuration:

1. Register a new test account
2. Check SendGrid Activity Feed for delivery status
3. Verify emails are delivered and links work
4. Test password reset functionality

## Troubleshooting

**Emails not sending:**
- Check SendGrid API key permissions
- Verify sender email is authenticated in SendGrid  
- Check Supabase logs in Dashboard → Logs

**Email marked as spam:**
- Complete domain authentication in SendGrid
- Add SPF/DKIM records to your domain
- Use a professional sender address (not gmail, yahoo, etc.)

**Links not working:**
- Verify Site URL in Supabase Auth settings
- Check redirect URLs are configured correctly

## Environment Variables

Add to your `.env` file for testing:
```
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
REACT_APP_FROM_EMAIL=noreply@yourdomain.com
```

Note: For production, these should be configured in Supabase Dashboard, not in your app environment variables.