import { Octokit } from '@octokit/rest';
import { PRInfo, FileDiff } from '../types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getPRInfo(owner: string, repo: string, pullNumber: number): Promise<PRInfo> {
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

  async getPRDiff(owner: string, repo: string, pullNumber: number): Promise<string> {
    const { data } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: 'diff',
      },
    });

    return data as unknown as string;
  }

  async getPRFiles(owner: string, repo: string, pullNumber: number): Promise<FileDiff[]> {
    const { data } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return data.map(file => ({
      filename: file.filename,
      status: file.status as 'added' | 'modified' | 'removed' | 'renamed',
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch || '',
      blob_url: file.blob_url,
      raw_url: file.raw_url,
      contents_url: file.contents_url,
    }));
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string> {
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

  parsePRUrl(prUrl: string): { owner: string; repo: string; pullNumber: number } {
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
