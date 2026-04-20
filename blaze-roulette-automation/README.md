# Blaze Roulette Automation

## Overview
This project automates roulette betting on various online platforms, with a focus on legal compliance and user security.

## Setup Instructions
1. **Extract the ZIP file** to `C:\laragon\www\blaze-roulette-automation`.
2. **Install dependencies**:
   ```powershell
   npm install
   ```
3. **Build the frontend**:
   ```powershell
   npm run build
   ```
4. **Start the server**:
   ```powershell
   npm start
   ```
5. **Test the application**:
   - Open `http://localhost:3000`.
   - Login with `admin`/`Admin123!`.
   - Verify access to `/admin-panel`.

## VPS Deployment
Instructions for deploying on Ubuntu 22.04+ are included in the project documentation.

## Troubleshooting
- **Build Fails**: Run `npm run build -- --debug` and check the output.
- **Blank Screen**: Ensure `public/dist` contains the build files.
- **Port Conflict**: Use `netstat -aon | findstr :3000` to resolve.

## Disclaimer
Automating betting sites may violate terms of service and local laws. Use responsibly with demo accounts and ensure SSL in production.
