import { CodeRabbitComment, FileDiff, PRInfo } from '../types';
export declare class CodeRabbitCLIService {
    private isInstalled;
    constructor();
    private checkInstallation;
    installCodeRabbit(): Promise<void>;
    reviewPR(prInfo: PRInfo, files: FileDiff[]): Promise<CodeRabbitComment[]>;
    reviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]>;
    private parseTextOutput;
    private mapSeverity;
    mockReviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]>;
}
//# sourceMappingURL=coderabbit-cli.d.ts.map