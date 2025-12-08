# Getting Started with AudioFlow

This guide will help you set up and run the AudioFlow project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MongoDB Atlas Account** (free tier available at [mongodb.com/atlas](https://www.mongodb.com/atlas))
- **Azure Account** (optional - for Azure Speech-to-Text)

## Step 1: Install Dependencies

Navigate to the project directory and install all dependencies:

```bash
npm install
```

This will install:

- Fastify (web framework)
- Mongoose (MongoDB ODM)
- TypeScript and related tools
- Testing libraries (Jest)
- And all other dependencies

## Step 2: Set Up MongoDB Atlas

### Create a Free MongoDB Atlas Cluster:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Click "Build a Database"
4. Choose the **FREE** tier (M0)
5. Select a cloud provider and region (choose one closest to you)
6. Click "Create Cluster"

### Get Your Connection String:

1. In Atlas, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Replace `<password>` with your database user password
5. Add the database name: `mongodb+srv://username:password@cluster.mongodb.net/audioflow`

### Create a Database User:

1. In Atlas, go to **Database Access**
2. Click **"Add New Database User"**
3. Create a username and password (save these!)
4. Grant **"Read and write to any database"** privileges

### Configure Network Access:

1. In Atlas, go to **Network Access**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production, add only your server's IP address

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/audioflow?retryWrites=true&w=majority

# Azure Speech Service (OPTIONAL)
# Leave blank to use mock implementation
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# Retry Configuration (OPTIONAL)
MAX_RETRY_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=10000
```

### Important:

- **MONGODB_URI** is required - the app won't start without it
- **Azure credentials** are optional - the app will use mock transcription if not provided

## Step 4: Set Up Azure Speech-to-Text (Optional)

If you want real Azure transcription instead of mock:

1. Go to [portal.azure.com](https://portal.azure.com)
2. Create an **Azure Cognitive Services** resource
3. Choose **Speech** service
4. Select the **Free** tier (F0) for testing
5. After creation, go to **Keys and Endpoint**
6. Copy **Key 1** and **Region**
7. Add them to your `.env` file:

```env
AZURE_SPEECH_KEY=your-key-here
AZURE_SPEECH_REGION=eastus
```

## Step 5: Build the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

## Step 6: Run the Application

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 7: Verify It's Working

### Check Health Endpoint:

```bash
curl http://localhost:3000/health
```

You should see:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T...",
  "uptime": 1.234,
  "environment": "development",
  "azure": {
    "configured": false
  }
}
```

### Create a Mock Transcription:

```bash
curl -X POST http://localhost:3000/transcription \
  -H "Content-Type: application/json" \
  -d '{"audioUrl": "https://example.com/test.mp3"}'
```

You should get a response with the transcription ID.

### Get Recent Transcriptions:

```bash
curl http://localhost:3000/transcriptions
```

## Step 8: Run Tests

Run the test suite to ensure everything is working:

```bash
npm test
```

All tests should pass. The tests use an in-memory MongoDB (MongoMemoryServer), so they don't require a real database connection.

## Common Issues & Solutions

### Error: "Environment validation failed: MONGODB_URI"

**Solution:** Make sure you've created a `.env` file and added your MongoDB Atlas connection string.

### Error: "Connection failed" or "ECONNREFUSED"

**Solutions:**

1. Check your MongoDB Atlas connection string is correct
2. Verify your IP address is whitelisted in Atlas Network Access
3. Check your database username and password are correct

### Error: "Cannot find module 'X'"

**Solution:** Run `npm install` to install all dependencies.

### Tests failing

**Solutions:**

1. Make sure you've run `npm install`
2. Check that port 3000 (or test port) is not already in use
3. Try `npm test -- --forceExit` if tests hang

## Project Structure Quick Reference

```
AudioFlow/
├── src/
│   ├── config/          # Configuration (DB, environment)
│   ├── models/          # Mongoose schemas
│   ├── services/        # Business logic
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Error handling, validation
│   ├── websocket/       # WebSocket handlers
│   ├── utils/           # Utilities (retry, logger)
│   └── types/           # TypeScript types
├── tests/               # Test files
├── .env                 # Environment variables (create this)
└── package.json         # Dependencies and scripts
```

## Next Steps

Now that you have AudioFlow running:

1. **View API Documentation**: Open http://localhost:3000/docs for interactive Swagger UI
2. **Try the API**: Test all endpoints using curl, Postman, or Swagger UI
3. **Check the Logs**: Watch the console for detailed logging
4. **Monitor MongoDB**: View your data in MongoDB Atlas
5. **Add Azure**: Configure Azure Speech for real transcription
6. **Test WebSocket**: Try the streaming transcription endpoint
7. **Learn the Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns
8. **Review Implementation**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for details

## Available NPM Scripts

```bash
npm run dev        # Start development server with auto-reload
npm start          # Start production server
npm test           # Run all tests
npm run build      # Compile TypeScript to JavaScript
npm run lint       # Check code quality
npm run lint:fix   # Fix linting issues automatically
npm run format     # Format code with Prettier
```

## Getting Help

- Check the [README.md](../README.md) for project overview
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for implementation details
- Review the code examples in `tests/` folder
- Check MongoDB Atlas documentation for database issues
- Review Azure Speech SDK documentation for transcription issues

## Quick Test Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with MongoDB URI
- [ ] Application starts (`npm run dev`)
- [ ] Health check returns 200 OK
- [ ] Can create mock transcription
- [ ] Can fetch transcriptions list
- [ ] Tests pass (`npm test`)

Congratulations! You're ready to use AudioFlow. 🎉
