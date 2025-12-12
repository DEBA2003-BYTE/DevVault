#!/bin/bash

# Risk-Based Authentication System Setup Script

echo "🔐 Risk-Based Authentication System Setup"
echo "=========================================="
echo ""

# Check if .env exists
if [ -f "Backend/.env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📝 Please provide the following configuration details:"
echo ""

# MongoDB
echo "MongoDB Atlas Configuration:"
read -p "MongoDB Connection URI: " MONGODB_URI

# JWT
echo ""
echo "JWT Configuration:"
read -p "JWT Secret (or press Enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

# AWS S3
echo ""
echo "AWS S3 Configuration:"
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "AWS Region (e.g., us-east-1): " AWS_REGION
read -p "S3 Bucket Name: " AWS_BUCKET_NAME

# Email
echo ""
echo "Email Configuration (for OTP):"
read -p "Email Host (default: smtp.gmail.com): " EMAIL_HOST
EMAIL_HOST=${EMAIL_HOST:-smtp.gmail.com}
read -p "Email Port (default: 587): " EMAIL_PORT
EMAIL_PORT=${EMAIL_PORT:-587}
read -p "Email Address: " EMAIL_USER
read -p "Email Password/App Password: " EMAIL_PASSWORD

# Server
echo ""
echo "Server Configuration:"
read -p "Port (default: 5000): " PORT
PORT=${PORT:-5000}

# Create .env file
cat > Backend/.env << EOF
# MongoDB Atlas
MONGODB_URI=$MONGODB_URI

# JWT Secret
JWT_SECRET=$JWT_SECRET

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_REGION=$AWS_REGION
AWS_BUCKET_NAME=$AWS_BUCKET_NAME

# Nodemailer Configuration
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=$EMAIL_PORT
EMAIL_USER=$EMAIL_USER
EMAIL_PASSWORD=$EMAIL_PASSWORD

# Server Configuration
PORT=$PORT
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=qwerty123
EOF

echo ""
echo "✅ Configuration saved to Backend/.env"
echo ""

# Install dependencies
echo "📦 Installing backend dependencies..."
cd Backend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd Backend && npm start"
echo "2. Frontend: cd Frontend && npm start"
echo ""
echo "Admin credentials:"
echo "  Email: admin@gmail.com"
echo "  Password: qwerty123"
echo ""
echo "🚀 Happy coding!"
