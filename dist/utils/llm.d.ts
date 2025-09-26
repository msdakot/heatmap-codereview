export declare class LLMService {
    private openai;
    constructor(apiKey: string);
    generateResponse(prompt: string, mode?: 'fast' | 'slow'): Promise<string>;
    analyzeCodeQuality(code: string, context?: string): Promise<{
        score: number;
        issues: string[];
        suggestions: string[];
    }>;
}
//# sourceMappingURL=llm.d.ts.map