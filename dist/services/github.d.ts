import { PRInfo, FileDiff } from '../types';
export declare class GitHubService {
    private octokit;
    constructor(token: string);
    getPRInfo(owner: string, repo: string, pullNumber: number): Promise<PRInfo>;
    getPRDiff(owner: string, repo: string, pullNumber: number): Promise<string>;
    getPRFiles(owner: string, repo: string, pullNumber: number): Promise<FileDiff[]>;
    getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string>;
    parsePRUrl(prUrl: string): {
        owner: string;
        repo: string;
        pullNumber: number;
    };
}
//# sourceMappingURL=github.d.ts.map