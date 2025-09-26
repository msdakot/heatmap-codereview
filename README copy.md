# PR Heatmap Reviewer

An AI-powered code review tool that generates heatmaps for GitHub pull requests, highlighting lines that need attention based on severity levels and integrating with CodeRabbit CLI for additional AI review comments.

## Features

- **4-Level Severity System**: Critical (Red), High (Orange), Medium (Blue), Low (Green)
- **Background Highlighting**: Lines are highlighted with appropriate colors in Cursor
- **Detailed Hover Information**: Hover over highlighted lines to see:
  - Severity level and percentage score
  - Review reason
  - CodeRabbit AI comments and suggestions
  - Code preview
- **GitHub Integration**: Analyzes any GitHub PR
- **CodeRabbit CLI Integration**: Uses open-source CodeRabbit CLI (no API key required)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

**Note**: CodeRabbit CLI will be installed automatically on first use - no API key required!

### 3. Start the Server

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### 4. Install Cursor Extension

1. Open Cursor
2. Go to Extensions (Cmd+Shift+X)
3. Click "Install from VSIX" or load the extension folder
4. Navigate to the `cursor-extension` folder and install

## Usage

### In Cursor:

1. Open any file from a GitHub PR
2. Press `Cmd+Shift+P` and run "PR Heatmap: Analyze PR Heatmap"
3. Enter the GitHub PR URL when prompted
4. Lines will be highlighted based on severity:
   - **Red**: Critical issues (security, breaking changes)
   - **Orange**: High priority (performance, complex logic)
   - **Blue**: Medium priority (code quality, maintainability)
   - **Green**: Low priority (minor improvements, style)

### Hover Information:

Hover over any highlighted line to see:
- Severity level and percentage score
- Why the line needs review
- CodeRabbit AI comments and suggestions
- Code preview

## CodeRabbit Integration

This tool uses the **CodeRabbit CLI** which is:
- ✅ **Open source** - no API key required
- ✅ **Automatically installed** on first use
- ✅ **Runs locally** - no external API calls
- ✅ **Free to use** - no rate limits

The CLI is installed using:
```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

## API Endpoints

### POST /api/review

Analyze a GitHub PR and generate heatmap data.

**Request:**
```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "includeCodeRabbit": true
}
```

**Response:**
```json
{
  "prInfo": { ... },
  "files": [
    {
      "filename": "src/file.ts",
      "lines": [...],
      "tokenScores": [...],
      "codeRabbitComments": [...],
      "severityDistribution": {
        "critical": 2,
        "high": 5,
        "medium": 8,
        "low": 3
      }
    }
  ],
  "overallScore": 0.75,
  "totalLinesChanged": 50,
  "criticalIssues": 2
}
```

## Severity Levels

| Level | Color | Score Range | Description |
|-------|-------|-------------|-------------|
| Critical | Red | 0.8-1.0 | Security vulnerabilities, breaking changes, major bugs |
| High | Orange | 0.6-0.79 | Performance issues, complex logic, potential bugs |
| Medium | Blue | 0.4-0.59 | Code quality, maintainability concerns |
| Low | Green | 0.2-0.39 | Minor improvements, style issues |

## Development

### Building the Extension

```bash
cd cursor-extension
npm install
npm run compile
```

### Running Tests

```bash
npm test
```

## Configuration

The Cursor extension can be configured in settings:

- `prHeatmap.githubToken`: GitHub API token
- `prHeatmap.openaiApiKey`: OpenAI API key
- `prHeatmap.serverUrl`: URL of the heatmap analysis server

## Troubleshooting

### CodeRabbit CLI Issues

If CodeRabbit CLI fails to install or run:

1. **Manual Installation**:
   ```bash
   curl -fsSL https://cli.coderabbit.ai/install.sh | sh
   ```

2. **Check Installation**:
   ```bash
   coderabbit --version
   ```

3. **Fallback Mode**: The system will use mock comments if CodeRabbit CLI is unavailable

### Common Issues

- **"No active editor found"**: Make sure you have a file open in Cursor
- **"Invalid PR URL"**: Ensure the URL follows the format: `https://github.com/owner/repo/pull/123`
- **"Failed to analyze PR"**: Check your GitHub token and internet connection

## License

MIT
