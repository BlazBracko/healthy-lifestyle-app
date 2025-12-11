# How to Start the Healthy Lifestyle App

This application consists of three main components:
1. **Backend** - Node.js/Express API server (port 3001)
2. **Web** - React web application (port 3000)
3. **Mobile** - React Native/Expo mobile application

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- MongoDB (connection string is already configured in the code)
- For mobile: Expo CLI and Expo Go app on your device

## Option 1: Using Docker Compose (Recommended for Backend + Web)

This is the easiest way to start both backend and web together:

```bash
# From the root directory
docker-compose up
```

This will start:
- Backend on http://localhost:3001
- Web on http://localhost:3000

To run in detached mode:
```bash
docker-compose up -d
```

To stop:
```bash
docker-compose down
```

## Option 2: Manual Setup (Development)

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Start the backend server
npm start
# OR for development with auto-reload:
npm run dev
```

The backend will run on **http://localhost:3001**

### 2. Start the Web Application

Open a new terminal:

```bash
# Navigate to web directory
cd web

# Install dependencies (first time only)
npm install

# Start the React development server
npm start
```

The web app will automatically open in your browser at **http://localhost:3000**

### 3. Start the Mobile Application

Open a new terminal:

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies (first time only)
npm install

# Start Expo
npm start
# OR for specific platforms:
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

This will:
- Start the Expo development server
- Show a QR code you can scan with Expo Go app
- Provide options to open in iOS simulator, Android emulator, or web browser

## Quick Start Commands Summary

### All services (using Docker):
```bash
docker-compose up
```

### Manual start (3 separate terminals):
```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Web
cd web && npm install && npm start

# Terminal 3 - Mobile
cd mobile && npm install && npm start
```

## Troubleshooting

1. **Port already in use**: Make sure ports 3000 and 3001 are not already in use
2. **MongoDB connection**: The app uses a MongoDB Atlas connection string that should work out of the box
3. **Dependencies**: Make sure to run `npm install` in each directory before starting
4. **Mobile issues**: Make sure you have Expo CLI installed globally: `npm install -g expo-cli`

## Development Notes

- Backend uses nodemon for auto-reload in development mode (`npm run dev`)
- Web uses React's hot-reload by default
- Mobile uses Expo's fast refresh for instant updates

