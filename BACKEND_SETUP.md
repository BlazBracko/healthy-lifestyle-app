# Backend Setup Instructions

## Quick Start

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   The server should start on port 3001 and you should see: "Server is running on port: 3001"

2. **Verify Backend is Running:**
   - Open your browser and go to: `http://localhost:3001`
   - You should see: "Hello World!"

3. **If using ngrok:**
   - Make sure ngrok is running and pointing to port 3001
   - The URL should be: `https://mallard-set-akita.ngrok-free.app`
   - Test it in browser first to make sure it's accessible

## Troubleshooting

### If you get HTML responses instead of JSON:

1. **Backend not running:**
   - Check if backend is running: `lsof -ti:3001`
   - Start it: `cd backend && npm run dev`

2. **Ngrok tunnel not active:**
   - Restart ngrok: `ngrok http 3001`
   - Update the URL in mobile app if it changed

3. **CORS issues:**
   - Backend CORS is now configured to allow all origins
   - Restart backend after changes: `npm run dev`

## Testing the API

Test the login endpoint:
```bash
curl -X POST https://mallard-set-akita.ngrok-free.app/users/login \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{"username":"test","password":"test"}'
```

If you get JSON back, the backend is working correctly.

