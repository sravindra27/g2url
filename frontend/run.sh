#!/bin/bash

echo "Starting g2url.in Frontend Development Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Installing..."
    npm install
fi

echo ""
echo "Frontend server starting on http://localhost:3000"
echo "Press CTRL+C to stop the server"
echo ""

npm run dev

