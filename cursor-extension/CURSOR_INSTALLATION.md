# Cursor Extension Installation Guide

## 🚀 **How to Install and Use the PR Heatmap Extension in Cursor**

### **Step 1: Make sure the server is running**
```bash
# In the main project directory
npm run dev
```

### **Step 2: Install the Extension in Cursor**

#### **Method A: Load Extension from Folder (Recommended)**
1. Open Cursor
2. Press `Cmd+Shift+P` (or `Ctrl+Shift+P` on Windows/Linux)
3. Type "Extensions: Install from VSIX..." or "Developer: Install Extension from Location..."
4. Navigate to the `cursor-extension` folder in this project
5. Select the folder and install

#### **Method B: Copy Extension Files**
1. Copy the entire `cursor-extension` folder to your Cursor extensions directory:
   - **macOS**: `~/.cursor/extensions/`
   - **Windows**: `%USERPROFILE%\.cursor\extensions\`
   - **Linux**: `~/.cursor/extensions/`
2. Restart Cursor

### **Step 3: Configure the Extension**
1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "PR Heatmap"
3. Set your configuration:
   - **Server URL**: `http://localhost:3000` (default)
   - **GitHub Token**: Your GitHub API token
   - **OpenAI API Key**: Your OpenAI API key

### **Step 4: Use the Extension**

#### **To Analyze a PR:**
1. Open any file from a GitHub PR in Cursor
2. Press `Cmd+Shift+P` (or `Ctrl+Shift+P`)
3. Type "PR Heatmap: Analyze PR Heatmap"
4. Enter the GitHub PR URL when prompted
5. Watch as lines get highlighted with colors!

#### **To Clear the Heatmap:**
1. Press `Cmd+Shift+P` (or `Ctrl+Shift+P`)
2. Type "PR Heatmap: Clear Heatmap"

### **Step 5: See the Colored Heatmap!**

Lines will be highlighted with background colors:
- 🔴 **Red**: Critical issues (security, breaking changes)
- 🟠 **Orange**: High priority (performance, complex logic)
- 🔵 **Blue**: Medium priority (code quality, maintainability)
- 🟢 **Green**: Low priority (minor improvements, style)

**Hover over highlighted lines** to see:
- Severity level and percentage score
- Why the line needs review
- CodeRabbit AI comments and suggestions

## 🎯 **Example Workflow:**

1. **Clone a repository** with a PR
2. **Open a file** from that PR in Cursor
3. **Run the extension** with the PR URL
4. **See colored lines** highlighting what needs review
5. **Hover for details** about each highlighted line

## 🔧 **Troubleshooting:**

- **"No active editor found"**: Make sure you have a file open in Cursor
- **"Server not running"**: Make sure `npm run dev` is running in the main project
- **"Invalid PR URL"**: Use the full GitHub PR URL format: `https://github.com/owner/repo/pull/123`

## 🎨 **What You'll See:**

```typescript
// This line would have a red background (Critical - 92%)
function processUserData(userData) {
  // This line would have orange background (High - 78%)  
  const apiKey = userData.apiKey;
  // This line would have blue background (Medium - 65%)
  const processed = transformData(userData);
  // This line would have green background (Low - 45%)
  return processed;
}
```

**Enjoy your AI-powered code review heatmap!** 🎉
