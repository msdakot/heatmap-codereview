"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
class HeatmapDecorator {
    constructor() {
        this.decorations = new Map();
        this.currentDecorations = new Map();
        this.createDecorations();
    }
    createDecorations() {
        // Critical severity - red background
        this.decorations.set('critical', vscode.window.createTextEditorDecorationType({
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontWeight: 'bold',
            isWholeLine: true,
            border: '1px solid #dc2626'
        }));
        // High severity - orange background
        this.decorations.set('high', vscode.window.createTextEditorDecorationType({
            backgroundColor: '#f97316',
            color: '#ffffff',
            fontWeight: 'bold',
            isWholeLine: true,
            border: '1px solid #ea580c'
        }));
        // Medium severity - blue background
        this.decorations.set('medium', vscode.window.createTextEditorDecorationType({
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontWeight: 'bold',
            isWholeLine: true,
            border: '1px solid #2563eb'
        }));
        // Low severity - green background
        this.decorations.set('low', vscode.window.createTextEditorDecorationType({
            backgroundColor: '#22c55e',
            color: '#ffffff',
            fontWeight: 'bold',
            isWholeLine: true,
            border: '1px solid #16a34a'
        }));
    }
    applyHeatmap(editor, heatmapData) {
        this.clearHeatmap(editor);
        const fileName = editor.document.fileName;
        const normalizedEditorPath = fileName.replace(/\\/g, '/').toLowerCase();
        const editorBase = normalizedEditorPath.split('/').pop() || '';
        let bestScore = -1;
        let bestIdx = -1;
        heatmapData.files.forEach((f, idx) => {
            const prPath = (f.filename || '').replace(/\\/g, '/').toLowerCase();
            const prBase = prPath.split('/').pop() || '';
            let score = 0;
            if (normalizedEditorPath.endsWith(prPath))
                score = 3;
            else if (editorBase === prBase)
                score = 2;
            else if (normalizedEditorPath.includes(prPath))
                score = 1;
            if (score > bestScore) {
                bestScore = score;
                bestIdx = idx;
            }
        });
        const fileData = bestScore > 0 && bestIdx >= 0 ? heatmapData.files[bestIdx] : undefined;
        if (!fileData) {
            console.log('No matching file found in heatmap data');
            vscode.window.showWarningMessage(`No heatmap data found for current file. Available files: ${heatmapData.files.map(f => f.filename).join(', ')}`);
            return;
        }
        console.log('Found matching file:', fileData.filename);
        console.log('Lines with changes:', fileData.lines.filter(l => l.hasChanged).length);
        const decorations = new Map();
        // Initialize decoration arrays
        ['critical', 'high', 'medium', 'low'].forEach(severity => {
            decorations.set(severity, []);
        });
        // Process each line
        fileData.lines.forEach(line => {
            if (line.hasChanged && line.severity && line.shouldBeReviewedScore) {
                console.log(`Processing line ${line.lineNumber}: ${line.line.substring(0, 50)}... (${line.severity})`);
                const range = new vscode.Range(line.lineNumber - 1, 0, line.lineNumber - 1, line.line.length);
                const decoration = {
                    range,
                    hoverMessage: this.createHoverMessage(line, fileData.codeRabbitComments || [])
                };
                decorations.get(line.severity)?.push(decoration);
            }
        });
        // Apply decorations
        decorations.forEach((decs, severity) => {
            if (decs.length > 0) {
                console.log(`Applying ${decs.length} ${severity} decorations`);
                const decorationType = this.decorations.get(severity);
                if (decorationType) {
                    editor.setDecorations(decorationType, decs);
                }
            }
        });
        this.currentDecorations.set(fileName, Array.from(decorations.values()).flat());
        const totalDecorations = Array.from(decorations.values()).flat().length;
        console.log(`Applied ${totalDecorations} total decorations`);
    }
    createHoverMessage(line, codeRabbitComments) {
        const message = new vscode.MarkdownString();
        // Header with severity and score
        const scorePercent = ((line.shouldBeReviewedScore || 0) * 100).toFixed(0);
        message.appendMarkdown(`## ${line.severity?.toUpperCase()} Priority - ${scorePercent}%\n\n`);
        // Reason for review
        if (line.shouldReviewWhy) {
            message.appendMarkdown(`**Review Reason:** ${line.shouldReviewWhy}\n\n`);
        }
        // Line details
        message.appendMarkdown(`**Line ${line.lineNumber}** | **Score:** ${line.shouldBeReviewedScore?.toFixed(2)}\n\n`);
        // CodeRabbit comments for this line
        const lineComments = codeRabbitComments.filter(comment => comment.line === line.lineNumber);
        if (lineComments.length > 0) {
            message.appendMarkdown(`### 🤖 AI Review Comments\n\n`);
            lineComments.forEach((comment, index) => {
                message.appendMarkdown(`**${index + 1}. ${comment.category.toUpperCase()}** (${comment.severity})\n`);
                message.appendMarkdown(`${comment.body}\n\n`);
                if (comment.suggestion) {
                    message.appendMarkdown(`**💡 Suggestion:** ${comment.suggestion}\n\n`);
                }
            });
        }
        // Line content preview
        message.appendMarkdown(`### Code Preview\n`);
        message.appendCodeblock(line.line, 'typescript');
        return message;
    }
    clearHeatmap(editor) {
        this.decorations.forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
        this.currentDecorations.delete(editor.document.fileName);
    }
    dispose() {
        this.decorations.forEach(decoration => decoration.dispose());
    }
}
class HeatmapProvider {
    constructor() {
        this.decorator = new HeatmapDecorator();
        this.serverUrl = vscode.workspace.getConfiguration('prHeatmap').get('serverUrl', 'http://localhost:3000');
    }
    async analyzePR() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        // Get PR URL from user
        const prUrl = await vscode.window.showInputBox({
            prompt: 'Enter GitHub PR URL',
            placeHolder: 'https://github.com/owner/repo/pull/123',
            validateInput: (value) => {
                if (!value || !value.includes('github.com') || !value.includes('/pull/')) {
                    return 'Please enter a valid GitHub PR URL';
                }
                return null;
            }
        });
        if (!prUrl) {
            return;
        }
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing PR heatmap...",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Fetching PR data..." });
                const response = await axios_1.default.post(`${this.serverUrl}/api/review`, {
                    prUrl,
                    includeCodeRabbit: true
                }, {
                    timeout: 120000
                });
                progress.report({ increment: 50, message: "Processing heatmap data..." });
                const heatmapData = response.data;
                progress.report({ increment: 100, message: "Applying heatmap..." });
                this.decorator.applyHeatmap(editor, heatmapData);
                // Show summary
                const totalLines = heatmapData.files.reduce((sum, file) => sum + file.lines.filter(l => l.hasChanged).length, 0);
                const criticalLines = heatmapData.files.reduce((sum, file) => sum + file.lines.filter(l => l.severity === 'critical').length, 0);
                vscode.window.showInformationMessage(`Heatmap applied! ${totalLines} changed lines analyzed, ${criticalLines} critical issues found.`);
            }
            catch (error) {
                console.error('Heatmap analysis error:', error);
                vscode.window.showErrorMessage(`Failed to analyze PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    clearHeatmap() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.decorator.clearHeatmap(editor);
            vscode.window.showInformationMessage('Heatmap cleared');
        }
    }
    dispose() {
        this.decorator.dispose();
    }
}
function activate(context) {
    const provider = new HeatmapProvider();
    // Register commands
    const analyzeCommand = vscode.commands.registerCommand('prHeatmap.analyzePR', () => {
        provider.analyzePR();
    });
    const clearCommand = vscode.commands.registerCommand('prHeatmap.clearHeatmap', () => {
        provider.clearHeatmap();
    });
    context.subscriptions.push(analyzeCommand, clearCommand, provider);
    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(graph) PR Heatmap";
    statusBarItem.command = 'prHeatmap.analyzePR';
    statusBarItem.tooltip = 'Analyze PR Heatmap';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}
exports.activate = activate;
function deactivate() {
    // Cleanup
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map