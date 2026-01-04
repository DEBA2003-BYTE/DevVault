# Vercel Deployment Guide

## 🚀 Quick Deploy

### Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel"
   git push origin main
   ```

2. **Go to Vercel**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your repository

3. **Add Environment Variables**
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_random_secret_key
   ADMIN_PASSWORD=your_admin_password
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=your_bucket
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   NODE_ENV=production
   ```

4. **Deploy** - Click "Deploy" button

---

## ✅ What's Already Configured

- ✅ `vercel.json` - Deployment configuration
- ✅ `api/index.js` - Serverless entry point
- ✅ `Frontend/js/config.js` - Auto-detects environment
- ✅ `Backend/server.js` - Vercel compatibility

---

## 📋 Prerequisites

### MongoDB Atlas
- Create free cluster at https://www.mongodb.com/cloud/atlas
- Whitelist all IPs: `0.0.0.0/0` in Network Access

### AWS S3
- Create bucket
- Get Access Key and Secret
- Enable CORS

### Gmail
- Enable 2FA
- Generate App Password at https://myaccount.google.com/apppasswords

---

## 🧪 Test After Deployment

Visit `https://your-project.vercel.app` and test:
- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] OTP email received
- [ ] File upload/download
- [ ] Admin dashboard (username: `admin`)

---

## 🐛 Troubleshooting

**MongoDB fails**: Whitelist `0.0.0.0/0` in Network Access

**API 500 error**: Check Vercel function logs

**OTP not received**: Use Gmail App Password, not regular password

**Files won't upload**: Check AWS credentials and S3 CORS

---

## 🔒 Security

Generate strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📱 Local Development

```bash
# Backend (Terminal 1)
cd Backend
npm start
# Runs on http://localhost:5001

# Frontend (Terminal 2)
cd Frontend  
npm start
# Runs on http://localhost:3000
```

Frontend auto-detects localhost and uses port 5001 for API.

---

## 🎉 Done!

Your app is live with:
- Serverless backend (auto-scaling)
- Global CDN
- Automatic HTTPS
- Zero server management

**Admin Login**: username `admin`, password from `ADMIN_PASSWORD`
