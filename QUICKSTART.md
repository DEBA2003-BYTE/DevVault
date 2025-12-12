# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Setup Script
```bash
./setup.sh
```

This will:
- Prompt you for MongoDB, AWS, and email credentials
- Create the `.env` file automatically
- Install all backend dependencies

### Step 2: Start Backend
```bash
cd Backend
npm start
```

Backend will run on `http://localhost:5001`

### Step 3: Start Frontend
Open a new terminal:
```bash
cd Frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 🔑 Default Admin Login
- **Email**: admin@gmail.com
- **Password**: qwerty123

## 📋 Before You Start

Make sure you have:
1. **MongoDB Atlas** account and connection string
2. **AWS S3** bucket with access credentials
3. **Gmail** account with App Password enabled
4. **Node.js** v14+ installed

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

1. Copy `.env.example` to `.env` in Backend folder
2. Fill in your credentials
3. Run `npm install` in Backend folder
4. Start backend with `npm start`
5. Open `Frontend/index.html` in browser or use a static server

## 📖 Full Documentation

See [README.md](README.md) for complete documentation.

## ⚡ Quick Test

1. Open `http://localhost:3000`
2. Click "Sign Up"
3. Allow location access
4. Create a test account
5. Login and explore!

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB URI is correct
- Verify all environment variables are set
- Make sure port 5000 is not in use

### Location not working
- Enable location services in your browser
- Grant location permission when prompted
- Use HTTPS in production (required for geolocation)

### File upload fails
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure bucket name matches in .env

### OTP not received
- Check email credentials
- For Gmail, use App Password (not regular password)
- Check spam folder

## 📞 Need Help?

Refer to the main [README.md](README.md) for detailed setup instructions and API documentation.
