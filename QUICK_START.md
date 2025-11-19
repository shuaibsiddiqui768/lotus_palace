# Quick Start Guide - Food Management System

## 5-Minute Setup

### Prerequisites
- Node.js installed
- MongoDB running locally OR MongoDB Atlas account

### Step 1: Backend Setup (2 minutes)

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected
```

### Step 2: Frontend Setup (1 minute)

Open new terminal in project root:

```bash
npm run dev
```

**Expected output:**
```
Ready in 2.5s - Local: http://localhost:3000
```

### Step 3: Access Admin Panel

1. Open browser: `http://localhost:3000/admin/manage-food`
2. Fill the form on the left:
   - Food Name: "Test Pizza"
   - Category: "Main Course"
   - Price: "12.99"
   - Description: "Delicious pizza"

3. Click "Add Food Item"

4. See item appear in the table on the right!

## Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Get All Foods
```bash
curl http://localhost:5000/api/food
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Ensure backend is running on port 5000 |
| "MongoDB connection failed" | Start MongoDB or update connection string |
| "Port 5000 already in use" | Change PORT in backend/.env |
| "No food items showing" | Refresh page or check browser console |

## File Locations Quick Reference

| What | Where |
|------|-------|
| Add Food Form | `app/admin/components/FoodForm.tsx` |
| Food List | `app/admin/components/FoodTable.tsx` |
| Backend Server | `backend/server.js` |
| Database Config | `backend/.env` |
| Frontend Config | `.env.local` |

## What's Running

| Port | Service |
|------|---------|
| 3000 | Frontend (Next.js) |
| 5000 | Backend API |
| 27017 | MongoDB (local) |

## Next Steps

1. **Deploy Backend** → See BACKEND_SETUP.md
2. **Add Edit Feature** → Create edit modal
3. **Image Upload** → Integrate Cloudinary
4. **Add Users** → Implement authentication
5. **Scale** → Add pagination, caching, etc.

## Features Available Now

✅ Add food items via form
✅ View all items in real-time
✅ Delete items with confirmation
✅ Filter by category
✅ Search items
✅ Spicy/Vegetarian badges
✅ Image preview
✅ Price validation

## API Cheat Sheet

```bash
# Get all foods
curl http://localhost:5000/api/food

# Get by category
curl http://localhost:5000/api/food/category/main-course

# Create food
curl -X POST http://localhost:5000/api/food \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","category":"main-course","price":12.99}'

# Delete food (replace ID)
curl -X DELETE http://localhost:5000/api/food/FOOD_ID
```

## Troubleshooting Commands

```bash
# Kill port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Check if MongoDB is running
mongosh

# View backend logs
npm run dev
```

## MongoDB Quick Test

```javascript
// Test connection
db.foodCollection.find({})

// Insert test data
db.foodCollection.insertOne({
  name: "Test",
  category: "main-course",
  price: 10,
  available: true
})
```

---

**Need detailed setup?** → See `BACKEND_SETUP.md`
**Need implementation details?** → See `IMPLEMENTATION_SUMMARY.md`
