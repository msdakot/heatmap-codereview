import { CodeRabbitComment, FileDiff, PRInfo } from '../types';
export declare class CodeRabbitService {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    reviewPR(prInfo: PRInfo, files: FileDiff[]): Promise<CodeRabbitComment[]>;
    reviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]>;
    private parseCodeRabbitResponse;
    private mapSeverity;
    mockReviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]>;
}
//# sourceMappingURL=coderabbit.d.ts.map