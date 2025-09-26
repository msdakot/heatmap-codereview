"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeRabbitService = void 0;
const axios_1 = __importDefault(require("axios"));
class CodeRabbitService {
    constructor(apiKey, baseUrl = 'https://api.coderabbit.ai') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async reviewPR(prInfo, files) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/reviews`, {
                repository: `${prInfo.owner}/${prInfo.repo}`,
                pull_request: prInfo.pullNumber,
                files: files.map(file => ({
                    filename: file.filename,
                    patch: file.patch,
                    status: file.status,
                })),
                options: {
                    include_suggestions: true,
                    include_explanations: true,
                    focus_areas: ['security', 'performance', 'maintainability', 'bugs'],
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return this.parseCodeRabbitResponse(response.data);
        }
        catch (error) {
            console.error('CodeRabbit API error:', error);
            return [];
        }
    }
    async reviewFile(filename, content, patch) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/v1/reviews/file`, {
                filename,
                content,
                patch,
                options: {
                    include_suggestions: true,
                    include_explanations: true,
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return this.parseCodeRabbitResponse(response.data);
        }
        catch (error) {
            console.error('CodeRabbit file review error:', error);
            return [];
        }
    }
    parseCodeRabbitResponse(data) {
        const comments = [];
        if (data.reviews) {
            for (const review of data.reviews) {
                if (review.comments) {
                    for (const comment of review.comments) {
                        comments.push({
                            id: comment.id || Math.random().toString(36).substr(2, 9),
                            path: comment.path,
                            line: comment.line,
                            body: comment.body,
                            severity: this.mapSeverity(comment.severity),
                            suggestion: comment.suggestion,
                            category: comment.category || 'general',
                        });
                    }
                }
            }
        }
        return comments;
    }
    mapSeverity(severity) {
        switch (severity?.toLowerCase()) {
            case 'error':
            case 'critical':
                return 'error';
            case 'warning':
            case 'warn':
                return 'warning';
            default:
                return 'info';
        }
    }
    // Mock implementation for development/testing
    async mockReviewFile(filename, content, patch) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const comments = [];
        const lines = content.split('\n');
        // Generate mock comments based on common patterns
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for potential issues
            if (line.includes('TODO') || line.includes('FIXME')) {
                comments.push({
                    id: `mock-${i}`,
                    path: filename,
                    line: i + 1,
                    body: 'Consider addressing this TODO/FIXME comment',
                    severity: 'warning',
                    suggestion: 'Complete the implementation or remove the comment',
                    category: 'maintainability',
                });
            }
            if (line.includes('console.log') || line.includes('console.error')) {
                comments.push({
                    id: `mock-${i}-log`,
                    path: filename,
                    line: i + 1,
                    body: 'Debug logging should be removed in production',
                    severity: 'info',
                    suggestion: 'Use a proper logging framework or remove debug statements',
                    category: 'maintainability',
                });
            }
            if (line.length > 120) {
                comments.push({
                    id: `mock-${i}-length`,
                    path: filename,
                    line: i + 1,
                    body: 'Line is too long and may be hard to read',
                    severity: 'warning',
                    suggestion: 'Break this line into multiple lines',
                    category: 'readability',
                });
            }
        }
        return comments;
    }
}
exports.CodeRabbitService = CodeRabbitService;
//# sourceMappingURL=coderabbit.js.map