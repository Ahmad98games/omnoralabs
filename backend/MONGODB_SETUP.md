# MongoDB Setup - Quick Start Guide

## 🚨 Problem

You're getting `SERVICE_UNAVAILABLE` error when placing orders because MongoDB is not connected.

## ✅ Quick Fix (Choose ONE option)

### Option 1: Use In-Memory MongoDB (FASTEST - 30 seconds)

**Best for:** Quick testing, no installation needed  
**Limitation:** Data will NOT persist after server restart

1. Open `.env` file in the backend folder
2. Add this line:

   ```
   USE_MEMORY_DB=true
   ```

3. Restart your backend server:

   ```powershell
   cd "c:\E-Commerce Website (Full)\backend"
   npm start
   ```

4. ✅ Done! Orders will now work (but data is temporary)

---

### Option 2: MongoDB Atlas Cloud (RECOMMENDED - 5 minutes)

**Best for:** Production-ready, free tier available  
**Benefit:** Data persists, works anywhere

1. **Sign up:** <https://www.mongodb.com/cloud/atlas/register>
2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Create User:**
   - Go to "Database Access" → "Add New Database User"
   - Username: `omnora_user`
   - Password: (create a strong password - save it!)
   - Database User Privileges: "Read and write to any database"

4. **Allow Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add `/omnora` at the end

6. **Update .env:**

   ```
   MONGODB_URI=mongodb+srv://omnora_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/omnora
   ```

7. **Restart backend:**

   ```powershell
   cd "c:\E-Commerce Website (Full)\backend"
   npm start
   ```

---

### Option 3: Install MongoDB Locally (10-15 minutes)

**Best for:** Offline development, full control

1. **Download:** <https://www.mongodb.com/try/download/community>
   - Select: Windows
   - Version: Latest
   - Package: MSI

2. **Install:**
   - Run the installer
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Run service as Network Service user"
   - Click "Next" → "Install"

3. **Verify:**
   - MongoDB should start automatically
   - No .env changes needed (already configured for localhost)

4. **Start backend:**

   ```powershell
   cd "c:\E-Commerce Website (Full)\backend"
   npm start
   ```

---

## 🔍 Verify Your Setup

Run the verification script:

```powershell
cd "c:\E-Commerce Website (Full)\backend"
node verify-mongodb.js
```

This will:

- ✅ Test MongoDB connection
- ✅ Show database details
- ❌ Provide troubleshooting if it fails

---

## 🎯 Expected Result

After setup, when you start the backend, you should see:

```
MongoDB Connection Established
System bootstrap completed { mode: 'READY' }
Server running on port 5000
```

**NOT:**

```
SYSTEM_DEGRADED: Database failed
```

---

## 🆘 Troubleshooting

### "ECONNREFUSED" error

- MongoDB is not running
- Use Option 1 (in-memory) or Option 2 (Atlas)

### "Authentication failed"

- Wrong username/password in connection string
- Check MongoDB Atlas user credentials

### Still getting SERVICE_UNAVAILABLE?

1. Make sure backend server restarted after .env changes
2. Check backend logs for "MongoDB Connection Established"
3. Run `node verify-mongodb.js` for diagnostics

---

## 📞 Need Help?

1. Check the detailed guide: `implementation_plan.md`
2. Run verification: `node verify-mongodb.js`
3. Check backend logs in terminal
