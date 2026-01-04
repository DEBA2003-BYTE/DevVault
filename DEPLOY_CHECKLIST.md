# Vercel Deployment Checklist

## ✅ Pre-Deployment

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB Network Access: `0.0.0.0/0` whitelisted
- [ ] AWS S3 bucket created with CORS enabled
- [ ] Gmail App Password generated
- [ ] All environment variables ready

## 🚀 Deployment Steps

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click "Add New Project"
3. [ ] Import your Git repository
4. [ ] Add all environment variables:
   - [ ] `MONGODB_URI`
   - [ ] `JWT_SECRET`
   - [ ] `ADMIN_PASSWORD`
   - [ ] `AWS_ACCESS_KEY_ID`
   - [ ] `AWS_SECRET_ACCESS_KEY`
   - [ ] `AWS_REGION`
   - [ ] `AWS_BUCKET_NAME`
   - [ ] `EMAIL_HOST`
   - [ ] `EMAIL_PORT`
   - [ ] `EMAIL_USER`
   - [ ] `EMAIL_PASSWORD`
   - [ ] `NODE_ENV=production`
5. [ ] Click "Deploy"
6. [ ] Wait for build to complete

## 🧪 Post-Deployment Testing

Visit your Vercel URL: `https://your-project.vercel.app`

- [ ] Homepage loads correctly
- [ ] Location access prompt works
- [ ] Signup creates new user
- [ ] Login works (low risk)
- [ ] Medium risk triggers OTP
- [ ] OTP email received
- [ ] OTP verification works
- [ ] File upload successful
- [ ] File download works
- [ ] Admin login works (username: `admin`)
- [ ] Admin dashboard accessible
- [ ] User management works
- [ ] Access logs visible

## 🔍 Verify Logs

- [ ] Check Vercel function logs (no errors)
- [ ] MongoDB connection successful
- [ ] No CORS errors in browser console
- [ ] API responses are 200 OK

## 📊 Monitor

- [ ] Enable Vercel Analytics
- [ ] Set up MongoDB Atlas alerts
- [ ] Configure AWS billing alerts

## ✨ Optional

- [ ] Add custom domain
- [ ] Enable Vercel password protection
- [ ] Set up staging environment
- [ ] Configure branch deployments

## 🎉 Success Criteria

All tests pass ✅
- No console errors
- All features working
- OTP emails delivered
- Files upload/download
- Admin access works

**Your app is live!** 🚀
