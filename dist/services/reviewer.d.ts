import { HeatmapData, ReviewRequest } from '../types';
export declare class PRReviewerService {
    private githubService;
    private codeRabbitService;
    private heatmapService;
    constructor(githubToken: string, openaiApiKey: string);
    generateHeatmapReview(request: ReviewRequest): Promise<HeatmapData>;
    getColorClasses(): Record<import("./heatmap").HeatmapColor, string>;
    getSeverityLabels(): Record<import("./heatmap").HeatmapSeverity, string>;
}
//# sourceMappingURL=reviewer.d.ts.map