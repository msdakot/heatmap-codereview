#!/bin/bash

echo "🚀 Setting up PR Heatmap Reviewer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install

# Install extension dependencies
echo "📦 Installing extension dependencies..."
cd cursor-extension
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before running the server"
fi

# Build the extension
echo "🔨 Building Cursor extension..."
cd cursor-extension
npm run compile
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev' to start the server"
echo "3. Install the Cursor extension from the cursor-extension folder"
echo "4. Open a file from a GitHub PR and run 'PR Heatmap: Analyze PR Heatmap'"
