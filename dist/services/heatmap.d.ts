import { LineAnalysis, TokenScore, AlgoInput, CodeRabbitComment } from '../types';
export type HeatmapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type HeatmapColor = 'red' | 'orange' | 'blue' | 'green';
export interface HeatmapScore {
    severity: HeatmapSeverity;
    color: HeatmapColor;
    score: number;
    reason: string | null;
}
export declare class HeatmapService {
    private llmService;
    constructor(openaiApiKey: string);
    mapScoreToSeverity(score: number): {
        severity: HeatmapSeverity;
        color: HeatmapColor;
    };
    analyzeDiff(input: AlgoInput): Promise<LineAnalysis[]>;
    computeTokenScores(lines: LineAnalysis[], codeRabbitComments?: CodeRabbitComment[]): Promise<TokenScore[]>;
    getHeatmapData(tokenScores: TokenScore[]): TokenScore[];
    getSeverityDistribution(tokenScores: TokenScore[]): Record<HeatmapSeverity, number>;
    getColorClasses(): Record<HeatmapColor, string>;
    getSeverityLabels(): Record<HeatmapSeverity, string>;
    private fallbackAnalysis;
    private extractAddedLineNumbers;
    calculateOverallScore(tokenScores: TokenScore[]): number;
    getCriticalIssuesCount(tokenScores: TokenScore[]): number;
}
//# sourceMappingURL=heatmap.d.ts.map