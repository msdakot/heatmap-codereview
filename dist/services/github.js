"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const rest_1 = require("@octokit/rest");
class GitHubService {
    constructor(token) {
        this.octokit = new rest_1.Octokit({
            auth: token,
        });
    }
    async getPRInfo(owner, repo, pullNumber) {
        const { data } = await this.octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
        });
        return {
            owner,
            repo,
            pullNumber,
            title: data.title,
            description: data.body || '',
            author: data.user?.login || 'unknown',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            baseBranch: data.base.ref,
            headBranch: data.head.ref,
        };
    }
    async getPRDiff(owner, repo, pullNumber) {
        const { data } = await this.octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: pullNumber,
            mediaType: {
                format: 'diff',
            },
        });
        return data;
    }
    async getPRFiles(owner, repo, pullNumber) {
        const { data } = await this.octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: pullNumber,
        });
        return data.map(file => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            patch: file.patch || '',
            blob_url: file.blob_url,
            raw_url: file.raw_url,
            contents_url: file.contents_url,
        }));
    }
    async getFileContent(owner, repo, path, ref) {
        const { data } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });
        if ('content' in data) {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        throw new Error('File content not found');
    }
    parsePRUrl(prUrl) {
        const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
        if (!match) {
            throw new Error('Invalid PR URL format');
        }
        return {
            owner: match[1],
            repo: match[2],
            pullNumber: parseInt(match[3], 10),
        };
    }
}
exports.GitHubService = GitHubService;
//# sourceMappingURL=github.js.map