# Email Setup Guide for Production

## Overview
The application uses Resend email service to send artwork completion notifications to users. This guide explains how to set up email functionality for production.

## Prerequisites
1. A Resend account (free tier provides 3000 emails/month)
2. A verified domain name for sending emails
3. Access to your domain's DNS settings

## Setup Steps

### 1. Create Resend Account
1. Sign up at [https://resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key and save it securely

### 2. Add and Verify Your Domain
1. In Resend dashboard, go to Domains section
2. Click "Add Domain"
3. Enter your domain (e.g., `pet2art.app`)
4. Add the required DNS records to your domain:
   - SPF record
   - DKIM records (usually 3 CNAME records)
5. Wait for DNS propagation (usually 5-30 minutes)
6. Click "Verify DNS" in Resend dashboard
7. Ensure status shows "Verified"

### 3. Configure Environment Variables

#### For Production (Vercel/Your hosting platform):
Add these environment variables in your hosting platform's dashboard:

```env
# Email Service Configuration
RESEND_API_KEY=re_xxxxxxxxxx_xxxxxxxxxxxxxxxxxx
EMAIL_FROM=YourApp <noreply@yourdomain.com>
```

**Important Notes:**
- `RESEND_API_KEY`: Your actual Resend API key
- `EMAIL_FROM`: Must use a verified domain (not `onboarding@resend.dev`)
- Format: `AppName <noreply@yourdomain.com>`

### 4. Test Email Functionality

After deployment, test the email system:

1. **Manual Test**: Create a test endpoint or use the existing test page
2. **Full Flow Test**: Generate an artwork and verify email delivery

### 5. Common Issues and Solutions

#### Email Not Sending
- **Check API Key**: Ensure RESEND_API_KEY is valid and not expired
- **Verify Domain**: Confirm domain status is "Verified" in Resend dashboard
- **Check Logs**: Review server logs for error messages

#### Using Test Domain (onboarding@resend.dev)
- This only works for sending to the account owner's email
- For production, always use your verified domain

#### API Key Invalid Error
- Generate a new API key from Resend dashboard
- Update environment variable immediately
- Restart your application/redeploy

## Email Features

The application sends emails in the following scenarios:
1. **Artwork Generation Complete**: Automatically sent when pet artwork is generated
   - Contains the generated image
   - Includes generation details
   - Links to user's artwork gallery

## Email Template

The email template includes:
- User's name
- Generated artwork image
- Template name used
- Generation time
- Link to view all artworks
- Tips for using the artwork

## Monitoring

- Check Resend dashboard for email statistics
- Monitor failed email attempts in server logs
- Set up alerts for email delivery failures (optional)

## Security Notes

1. Never commit API keys to version control
2. Use environment variables for all sensitive data
3. Rotate API keys periodically
4. Monitor for unusual email activity

## Support

For issues with:
- **Resend Service**: Contact Resend support
- **Application Integration**: Check server logs and environment configuration
- **Domain Verification**: Ensure DNS records are correctly configured