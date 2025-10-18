#!/bin/bash

# Twin - Quick Setup Script
echo "🚀 Setting up Twin - Portable AI Persona & Memory System"
echo "========================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Set up environment
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your API keys"
fi

# Initialize Convex (optional)
read -p "Do you want to initialize Convex now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Initializing Convex..."
    npx convex dev &
    CONVEX_PID=$!
    sleep 5
    kill $CONVEX_PID
    echo "✅ Convex initialized. Run 'npx convex dev' to start the dev server"
fi

# Install Workers dependencies
echo "📦 Setting up Cloudflare Workers..."
cd workers/api
pnpm install
cd ../..

# Create mock data mode
echo "🎭 Enabling mock mode for initial development..."
echo "NEXT_PUBLIC_USE_MOCK=true" >> .env.local

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Run 'pnpm dev' to start development with mock data"
echo "3. Run 'npx convex dev' in another terminal for real-time features"
echo "4. Visit http://localhost:3000"
echo ""
echo "🧪 To run tests: pnpm test:mock"
echo "🚀 To deploy: See DEVELOPMENT_CHECKLIST.md Phase 3"