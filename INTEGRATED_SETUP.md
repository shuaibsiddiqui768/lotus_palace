# 🚀 Integrated Food Management System - Setup & Usage

## What Changed

**Backend is now fully integrated into the Next.js project!**

Everything is in one folder using:
- ✅ Next.js API Routes (instead of separate Express server)
- ✅ MongoDB for database
- ✅ Mongoose for schemas
- ✅ No separate `backend/` folder needed

## Quick Start (2 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB

Edit `.env.local`:

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/foodhub
```

**MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodhub
```

### 3. Run Everything
```bash
npm run dev
```

### 4. Access Admin Panel
Open: `http://localhost:3000/admin/manage-food`

## Project Structure

```
📁 food_menu/
├── 📁 app/
│   ├── 📁 admin/
│   │   └── 📁 components/
│   │       ├── FoodForm.tsx          ← Add items
│   │       ├── FoodTable.tsx         ← List items
│   │       └── ...
│   ├── 📁 api/                       ← ✨ NEW BACKEND
│   │   └── 📁 food/
│   │       ├── route.ts              ← GET all, POST create
│   │       ├── [id]/route.ts         ← GET/PUT/DELETE item
│   │       └── category/[category]/  ← GET by category
│   └── ...
├── 📁 lib/                           ← ✨ NEW
│   └── mongodb.ts                    ← MongoDB connection
├── 📁 models/                        ← ✨ NEW
│   └── Food.ts                       ← Database schema
├── .env.local                        ← MongoDB URI
└── package.json                      ← Updated with mongoose
```

## API Endpoints

All endpoints are built-in and work from your app:

```
GET    /api/food              → Get all foods
GET    /api/food/:id          → Get one food
GET    /api/food/category/:cat → Get by category
POST   /api/food              → Add food
PUT    /api/food/:id          → Update food
DELETE /api/food/:id          → Delete food
```

## Files Created

### Backend Integration
- ✅ `lib/mongodb.ts` - MongoDB connection handler
- ✅ `models/Food.ts` - Mongoose schema with validation
- ✅ `app/api/food/route.ts` - Main food endpoints
- ✅ `app/api/food/[id]/route.ts` - Individual food operations
- ✅ `app/api/food/category/[category]/route.ts` - Category filtering

### Updated Files
- ✅ `package.json` - Added mongoose (run `npm install`)
- ✅ `.env.local` - MongoDB connection string
- ✅ `app/admin/components/FoodForm.tsx` - Uses `/api/food`
- ✅ `app/admin/components/FoodTable.tsx` - Uses `/api/food`
- ✅ `app/admin/manage-food/page.tsx` - Integrated

## Features Working

### Add Food Items
- Form with validation
- Required: name, category, price
- Optional: description, image, prep time, spicy, vegetarian
- Real-time feedback with toasts
- Auto-clear after success

### View Food Items
- Live list from database
- Thumbnail images
- Category badges
- Price display
- Spicy/Vegetarian indicators
- Availability status

### Delete Food Items
- Confirmation dialog
- Real-time removal
- Error handling
- Success notification

## MongoDB Setup

### Option 1: Local MongoDB

```bash
# Windows (if installed)
mongod

# Mac (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

Then use:
```
MONGODB_URI=mongodb://localhost:27017/foodhub
```

### Option 2: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/foodhub
   ```
5. Update `.env.local`

## Testing

### In Browser Console
```javascript
// Get all foods
fetch('/api/food').then(r => r.json()).then(d => console.log(d));

// Add food
fetch('/api/food', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Pizza',
    category: 'main-course',
    price: 12.99,
    description: 'Delicious pizza'
  })
}).then(r => r.json()).then(d => console.log(d));
```

### In Terminal
```bash
# Get all
curl http://localhost:3000/api/food

# Create
curl -X POST http://localhost:3000/api/food \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza","category":"main-course","price":12.99}'
```

## Common Issues

### ❌ "Cannot find module mongoose"
```bash
npm install
```

### ❌ "MongoDB connection failed"
- Start MongoDB locally, OR
- Update `.env.local` with Atlas URI

### ❌ "Port 3000 already in use"
```bash
# Kill process
# Windows: netstat -ano | findstr :3000 → taskkill /PID <PID> /F
# Mac/Linux: lsof -ti:3000 | xargs kill -9
```

### ❌ "Food items not showing"
1. Check browser console for errors
2. Verify `.env.local` has correct MongoDB URI
3. Check Network tab in DevTools
4. Make sure MongoDB is running

## Database Schema

```typescript
Food {
  _id: ObjectId
  name: string (required, max 100)
  category: enum (main-course, appetizer, dessert, beverage, salad, soup)
  description: string (max 500)
  price: number (required, min 0)
  image: string (URL, optional)
  available: boolean (default: true)
  preparationTime: number (default: 30)
  spicy: boolean (default: false)
  vegetarian: boolean (default: false)
  rating: number (0-5, default: 0)
  totalOrders: number (default: 0)
  createdAt: Date
  updatedAt: Date
}
```

## Cleanup

Delete these old files (no longer needed):
```bash
# Delete entire backend folder
rm -rf backend

# Delete old documentation
rm BACKEND_SETUP.md
rm QUICK_START.md
rm IMPLEMENTATION_SUMMARY.md
rm backend/.env
rm backend/.env.example
rm backend/.gitignore
rm backend/package.json
rm backend/README.md
```

## Next Steps

1. **Edit Feature** - Create modal to edit existing items
2. **Image Upload** - Add Cloudinary/AWS S3 integration
3. **Authentication** - Add admin login
4. **Categories** - Manage food categories
5. **Orders** - Create order management system
6. **Analytics** - Add dashboard with statistics

## Deployment

### Vercel (Best for Next.js)
1. Push to GitHub
2. Import at vercel.com
3. Add environment variable:
   ```
   MONGODB_URI=mongodb+srv://...
   ```
4. Deploy!

### Other Platforms
Set `MONGODB_URI` environment variable and deploy normally.

## Key Commands

```bash
npm run dev              # Start development
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Check code quality
npm run typecheck       # TypeScript validation
```

## Support

For more details, see:
- `SETUP_INTEGRATED.md` - Detailed setup guide
- `app/api/food/route.ts` - API implementation
- `models/Food.ts` - Database schema
- `lib/mongodb.ts` - Connection logic

---

**✨ All in one project - Simple, Clean, Powerful!**

Everything you need for food management is now integrated. Start building! 🎉
