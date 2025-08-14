#!/bin/bash

echo "🚀 Starting development server without Turbopack..."
echo "This will avoid the sourcemap errors and timeout issues."
echo ""

# Start without turbopack flag to avoid issues
cross-env NODE_NO_WARNINGS=1 next dev