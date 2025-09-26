export interface TokenScore {
    token: string;
    score: number | null;
    reason: string | null;
    lineNumber: number;
    characterIndex: number;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    color?: 'red' | 'orange' | 'blue' | 'green';
}
export interface LineAnalysis {
    line: string;
    lineNumber: number;
    hasChanged: boolean;
    shouldBeReviewedScore?: number;
    shouldReviewWhy?: string;
    mostImportantCharacterIndex: number;
    codeRabbitComments?: CodeRabbitComment[];
    severity?: 'critical' | 'high' | 'medium' | 'low';
    color?: 'red' | 'orange' | 'blue' | 'green';
}
export interface CodeRabbitComment {
    id: string;
    path: string;
    line: number;
    body: string;
    severity: 'info' | 'warning' | 'error';
    suggestion?: string;
    category: string;
}
export interface PRInfo {
    owner: string;
    repo: string;
    pullNumber: number;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    baseBranch: string;
    headBranch: string;
}
export interface FileDiff {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    changes: number;
    patch: string;
    blob_url: string;
    raw_url: string;
    contents_url: string;
}
export interface HeatmapData {
    prInfo: PRInfo;
    files: {
        filename: string;
        lines: LineAnalysis[];
        tokenScores: TokenScore[];
        codeRabbitComments: CodeRabbitComment[];
        severityDistribution: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    }[];
    overallScore: number;
    totalLinesChanged: number;
    criticalIssues: number;
    severityDistribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
export interface AlgoInput {
    fileDiff?: string;
    file?: string;
    filename?: string;
    prInfo?: PRInfo;
}
export interface ReviewRequest {
    prUrl: string;
    includeCodeRabbit: boolean;
    customPrompt?: string;
    focusAreas?: string[];
}
export type HeatmapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type HeatmapColor = 'red' | 'orange' | 'blue' | 'green';
export interface HeatmapScore {
    severity: HeatmapSeverity;
    color: HeatmapColor;
    score: number;
    reason: string | null;
}
//# sourceMappingURL=index.d.ts.map