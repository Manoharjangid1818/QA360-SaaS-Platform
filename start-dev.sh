#!/bin/bash
# Start backend on port 3001
PORT=3001 node backend/scripts/start.js &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend on port 5000
cd dashboard && npm start

# If frontend exits, kill backend
kill $BACKEND_PID 2>/dev/null
