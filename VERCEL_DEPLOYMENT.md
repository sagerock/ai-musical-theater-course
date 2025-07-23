# Vercel Deployment Checklist

## ✅ Pre-Deployment (Complete)
- [x] Created `/api/send-email.js` serverless function
- [x] Created `/api/health.js` health check endpoint  
- [x] Added `vercel.json` configuration file
- [x] Updated email service for production routing
- [x] Committed and pushed to GitHub
- [x] Built successfully locally

## 🔧 Vercel Dashboard Setup

### 1. Add Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:
```
REACT_APP_SENDGRID_API_KEY = your_sendgrid_api_key_here
REACT_APP_SENDGRID_FROM_EMAIL = sage@sagerock.com
REACT_APP_URL = https://your-vercel-url.vercel.app
```

### 2. Deploy
- Vercel should auto-deploy from GitHub
- Or manually trigger deployment in dashboard

## 🧪 Testing After Deployment

### 1. Health Check
Visit: `https://your-app.vercel.app/api/health`
Should return: `{"status":"ok","timestamp":"...","environment":"vercel-serverless"}`

### 2. Email Functionality
1. Go to your deployed app
2. Login as admin or instructor
3. Try sending a message through the messaging system
4. Check your email for delivery

### 3. Browser Console
Check browser console for:
- `📧 Attempting to send email via: /api/send-email`
- `✅ Email sent successfully via backend to: email@domain.com`

## 🔄 Development vs Production

### Local Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001` (Express server)
- Email API: `http://localhost:3001/api/send-email`

### Production (Vercel)
- Frontend: `https://your-app.vercel.app`
- Backend: Serverless functions
- Email API: `https://your-app.vercel.app/api/send-email`

## 🚨 Troubleshooting

### If emails aren't sending:
1. Check Vercel function logs in dashboard
2. Verify environment variables are set
3. Check SendGrid API key is valid
4. Test `/api/health` endpoint

### Common Issues:
- **CORS errors**: Should be resolved with serverless functions
- **Environment variables**: Make sure they're set in Vercel dashboard
- **Function timeout**: Vercel functions have 30-second timeout (configured in vercel.json)

## 🎯 Success Indicators

✅ **Frontend loads**: App displays normally
✅ **Backend functions work**: `/api/health` returns OK
✅ **Email sending works**: Real emails are delivered
✅ **No CORS errors**: No browser console errors
✅ **Messaging UI works**: Admin/instructor messaging interfaces functional

## 📞 Next Steps After Deployment

1. Test all messaging functionality
2. Verify email delivery
3. Check Vercel function logs
4. Update any hardcoded localhost URLs
5. Test with multiple users

Your messaging system is now ready for production! 🚀