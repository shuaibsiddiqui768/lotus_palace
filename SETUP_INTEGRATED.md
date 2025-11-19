# Integrated Setup Guide - Frontend & Backend in One Project

## Overview

The backend is now fully integrated into the Next.js project using:
- **Next.js API Routes** for all endpoints
- **MongoDB** for data persistence
- **Mongoose** for schema validation
- **Single project structure** - no separate backend folder

## Project Structure

```
food_menu/
├── app/
│   ├── admin/
│   │   └── components/
│   │       ├── FoodForm.tsx      # Add food items
│   │       ├── FoodTable.tsx     # Display food items
│   │       └── ...
│   ├── api/
│   │   └── food/
│   │       ├── route.ts           # GET all, POST create
│   │       ├── [id]/
│   │       │   └── route.ts       # GET/PUT/DELETE single, PATCH toggle
│   │       └── category/
│   │           └── [category]/route.ts  # GET by category
│   └── ...
├── lib/
│   └── mongodb.ts                # MongoDB connection
├── models/
│   └── Food.ts                   # Food schema
├── .env.local                    # Environment variables
└── package.json                  # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This includes the newly added `mongoose` package.

### 2. Configure MongoDB

Edit `.env.local`:

**Option A: Local MongoDB**
```
MONGODB_URI=mongodb://localhost:27017/foodhub
```

Make sure MongoDB is running locally:
```bash
# Windows (if installed)
mongod

# Mac (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/foodhub`)
4. Update `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodhub
```

### 3. Start the Application

```bash
npm run dev
```

This starts both frontend and backend together on `http://localhost:3000`

### 4. Access Admin Panel

Open browser: `http://localhost:3000/admin/manage-food`

## API Endpoints

All endpoints are relative to your app:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/food` | Get all food items |
| GET | `/api/food/:id` | Get specific food |
| GET | `/api/food/category/:category` | Get by category |
| POST | `/api/food` | Create new food |
| PUT | `/api/food/:id` | Update food |
| DELETE | `/api/food/:id` | Delete food |
| PATCH | `/api/food/:id` | Toggle availability |

### Example API Calls

**Get all foods:**
```javascript
const response = await fetch('/api/food');
const data = await response.json();
console.log(data.data);
```

**Create food:**
```javascript
const response = await fetch('/api/food', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Pizza',
    category: 'main-course',
    price: 12.99,
    description: 'Delicious pizza',
    preparationTime: 30,
    spicy: false,
    vegetarian: true
  })
});
const data = await response.json();
```

**Delete food:**
```javascript
const response = await fetch('/api/food/FOOD_ID', {
  method: 'DELETE'
});
const data = await response.json();
```

## Database Schema

### Food Collection

```typescript
{
  _id: ObjectId,
  name: string (required, max 100),
  category: 'main-course' | 'appetizer' | 'dessert' | 'beverage' | 'salad' | 'soup',
  description?: string (max 500),
  price: number (required, min 0),
  image?: string (URL),
  available: boolean (default: true),
  preparationTime: number (default: 30 minutes),
  spicy: boolean (default: false),
  vegetarian: boolean (default: false),
  rating: number (0-5, default: 0),
  totalOrders: number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## Features

### Admin Panel Features
✅ **Add Food Items**
  - Form validation
  - Required fields: name, category, price
  - Optional: description, image, prep time, spicy, vegetarian

✅ **View Food Items**
  - Real-time list from database
  - Thumbnail images
  - Category badges
  - Spicy/Vegetarian indicators
  - Availability status
  - Price display

✅ **Delete Food Items**
  - Confirmation dialog
  - Real-time list update
  - Error handling

✅ **Error Handling**
  - Toast notifications
  - Input validation
  - Network error handling
  - Loading states

## MongoDB Atlas Setup (Recommended for Deployment)

1. **Create Account**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Free tier available
3. **Create Database User**:
   - Go to Database Access
   - Add new user with password
   - Note: username and password
4. **Get Connection String**:
   - Go to Clusters
   - Click Connect
   - Select "Connect your application"
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/foodhub`

5. **Update .env.local**:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodhub
```

## Cleanup: Remove Old Backend Folder

Since the backend is now integrated, you can delete the separate `backend/` folder:

```bash
# Windows
rmdir /s /q backend

# Mac/Linux
rm -rf backend
```

Also remove these files (no longer needed):
- `backend/README.md`
- `backend/.env`
- `backend/.env.example`
- `backend/.gitignore`
- `BACKEND_SETUP.md`
- `QUICK_START.md`
- `IMPLEMENTATION_SUMMARY.md`

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Ensure MongoDB is running locally
- Or update `MONGODB_URI` to use MongoDB Atlas
- Check .env.local for correct connection string

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Module Not Found: mongoose
```
Error: Cannot find module 'mongoose'
```

**Solution:**
```bash
npm install
```

### Food Items Not Showing
1. Check browser console for errors
2. Verify MongoDB connection in `.env.local`
3. Check Network tab in DevTools for failed API calls
4. Ensure `/api/food` endpoint responds with data

### Build Errors
```bash
npm run lint
npm run typecheck
```

Fix any TypeScript errors before deploying.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter
npm run lint

# Type checking
npm run typecheck
```

## Testing the API

### Using Browser Console
```javascript
// Get all foods
fetch('/api/food').then(r => r.json()).then(d => console.log(d));

// Create food
fetch('/api/food', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test',
    category: 'main-course',
    price: 10
  })
}).then(r => r.json()).then(d => console.log(d));
```

### Using curl (Terminal)
```bash
# Get all
curl http://localhost:3000/api/food

# Create
curl -X POST http://localhost:3000/api/food \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","category":"main-course","price":12.99}'

# Delete
curl -X DELETE http://localhost:3000/api/food/FOOD_ID
```

## File Changes Made

### New Files Created
- `lib/mongodb.ts` - MongoDB connection handler
- `models/Food.ts` - Mongoose schema
- `app/api/food/route.ts` - GET all, POST create
- `app/api/food/[id]/route.ts` - GET/PUT/DELETE single, PATCH toggle
- `app/api/food/category/[category]/route.ts` - GET by category

### Updated Files
- `package.json` - Added mongoose dependency
- `.env.local` - MongoDB URI
- `app/admin/components/FoodForm.tsx` - Use `/api/food`
- `app/admin/components/FoodTable.tsx` - Use `/api/food`

### Files to Delete
- `backend/` folder (entire directory)
- Any standalone backend documentation

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Add environment variable:
   ```
   MONGODB_URI=<your-mongodb-atlas-uri>
   ```
5. Deploy!

### Other Platforms

For Heroku, Railway, or other platforms:
1. Set `MONGODB_URI` environment variable
2. Deploy Next.js app normally
3. API routes work automatically

## Next Steps

1. **Implement Edit Feature**
   - Create edit modal
   - Use PUT `/api/food/:id`
   - Pre-fill form with current data

2. **Add Image Upload**
   - Integrate Cloudinary or AWS S3
   - Store URL in database

3. **Authentication**
   - Add admin login
   - Protect API routes
   - Role-based access

4. **Advanced Features**
   - Pagination
   - Search/Filter
   - Bulk operations
   - Order management

## Support

- Check console for error messages
- Review MongoDB connection string
- Verify environment variables in .env.local
- Check Next.js documentation at next.js.org

---

**All backend and frontend code is now in one project!** 🎉
