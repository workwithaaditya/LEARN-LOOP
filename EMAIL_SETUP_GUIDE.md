# Email Notification Setup Guide

## Overview
Learn Loop now sends email notifications when users receive pings! This uses Gmail's free SMTP service via Nodemailer.

## Features
✅ Email notifications on ping received
✅ Beautiful HTML email templates
✅ Works even when user is offline
✅ 100% free (uses Gmail)
✅ Professional design with Learn Loop branding

## Setup Instructions

### Step 1: Create Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (enable if not already enabled)
3. **App Passwords** → Select "Mail" and "Other (Custom name)"
4. **Name it**: "Learn Loop Backend"
5. **Copy the 16-character password** (save it somewhere safe)

### Step 2: Add Environment Variables

Add these to your `.env` file in the `backend` folder:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**Example:**
```env
EMAIL_USER=learnloop.noreply@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install `nodemailer@^6.9.7`

### Step 4: Restart Backend Server

```bash
npm start
```

You should see:
```
✅ Email service ready
```

## How It Works

### When User Sends Ping:
1. ✅ Saves ping to database
2. ✅ Sends real-time notification (if user online)
3. ✅ Sends email notification to receiver's Gmail
4. ✅ Email contains sender name, message, and link to dashboard

### Email Template Features:
- 📧 Professional design with Learn Loop colors
- 👤 Shows sender's name prominently
- 💬 Displays ping message
- 🔗 Direct link to dashboard
- 📱 Mobile responsive
- 🌙 Clean and modern layout

## Testing

1. **Send a ping** to another user
2. **Check receiver's email** (including spam folder)
3. **Email should arrive** within seconds

## Troubleshooting

### "Email service error" in console:
- ✅ Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
- ✅ Verify 2-Step Verification is enabled on Google Account
- ✅ Use App Password, not regular Gmail password
- ✅ Remove spaces from app password

### Emails not sending:
- ✅ Check backend console for errors
- ✅ Verify user has email in database
- ✅ Check spam folder
- ✅ Gmail may have sending limits (500/day for free accounts)

### Email goes to spam:
- ✅ This is normal for new sender addresses
- ✅ Mark as "Not Spam" once
- ✅ Future emails will go to inbox

## Gmail Limits (Free Tier)

- **500 emails per day**
- **100 emails per hour**
- More than enough for Learn Loop!

## Future Enhancements

- [ ] Friend request email notifications
- [ ] Video call missed notifications
- [ ] Daily digest emails
- [ ] Email preferences in user settings
- [ ] Unsubscribe option
- [ ] Email verification on signup

## Security Notes

- ✅ Never commit `.env` file to GitHub
- ✅ Use App Password, never regular password
- ✅ App Password can be revoked anytime
- ✅ Each app should have its own App Password

## Alternative Email Services (Free Tier)

If you want to use something other than Gmail:

1. **SendGrid**: 100 emails/day free
2. **Mailgun**: 5,000 emails/month free for 3 months
3. **Resend**: 100 emails/day, 3,000/month free
4. **Brevo (Sendinblue)**: 300 emails/day free

For Learn Loop's usage, **Gmail is perfect** and simplest to setup!

---

**Status**: ✅ Ready to use
**Setup Time**: ~5 minutes
**Cost**: 100% Free
