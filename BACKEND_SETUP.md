# Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas cloud)
- npm or yarn

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure MongoDB Connection

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally
# Default connection string in .env
MONGODB_URI=mongodb://localhost:27017/foodhub
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get your connection string
4. Update `.env`:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodhub
```

### 3. Start the Backend Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

### 4. Configure Frontend

In the project root, create/update `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Run the Frontend

```bash
npm run dev
```

Visit `http://localhost:3000/admin/manage-food`

## Verify Backend is Running

Check the health endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "Server is running"
}
```

## API Endpoints

All endpoints are prefixed with `/api/food`

### 1. Get All Food Items
```
GET /api/food
Query Parameters:
  - category: Filter by category (main-course, appetizer, dessert, beverage, salad, soup)
  - available: Filter by availability (true/false)
```

### 2. Get Food Item by ID
```
GET /api/food/:id
```

### 3. Create Food Item
```
POST /api/food
Headers: Content-Type: application/json
Body: {
  "name": "Pizza",
  "category": "main-course",
  "description": "Delicious pizza",
  "price": 12.99,
  "image": "https://...",
  "preparationTime": 30,
  "spicy": false,
  "vegetarian": false
}
```

### 4. Update Food Item
```
PUT /api/food/:id
Body: (same as create)
```

### 5. Delete Food Item
```
DELETE /api/food/:id
```

### 6. Toggle Availability
```
PATCH /api/food/:id/toggle-availability
```

### 7. Get Food by Category
```
GET /api/food/category/:category
Categories: main-course, appetizer, dessert, beverage, salad, soup
```

## MongoDB Collections

### Food Collection
```json
{
  "_id": ObjectId,
  "name": "String (required)",
  "category": "String (enum: main-course, appetizer, dessert, beverage, salad, soup)",
  "description": "String",
  "price": "Number (required, min: 0)",
  "image": "String (URL)",
  "available": "Boolean (default: true)",
  "preparationTime": "Number (default: 30)",
  "spicy": "Boolean (default: false)",
  "vegetarian": "Boolean (default: false)",
  "rating": "Number (0-5, default: 0)",
  "totalOrders": "Number (default: 0)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running (local) or cluster is active (Atlas)
- Check connection string in `.env`
- Verify firewall allows connection

### CORS Errors
- Backend has CORS enabled for all origins by default
- If needed, modify `cors()` in `server.js`

### Frontend Cannot Find Backend
- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Clear browser cache and restart frontend

### Port Already in Use
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

## Project Structure

```
backend/
├── models/
│   └── Food.js           # MongoDB schema for food items
├── controllers/
│   └── foodController.js # Business logic
├── routes/
│   └── foodRoutes.js     # API endpoints
├── middleware/
│   └── errorHandler.js   # Error handling
├── server.js             # Express server setup
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
└── README.md            # Backend documentation
```

## Next Steps

1. Create additional models (Users, Orders, Categories, etc.)
2. Add authentication/authorization middleware
3. Implement image upload service (AWS S3, Cloudinary, etc.)
4. Add input validation and sanitization
5. Set up database indexing for performance
6. Add API rate limiting
7. Implement pagination for large datasets
8. Add logging and monitoring

## Support

For issues, check:
1. Console output and error messages
2. MongoDB connection status
3. API endpoint validation
4. Frontend environment variables
