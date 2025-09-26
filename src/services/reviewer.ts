import { GitHubService } from './github';
import { CodeRabbitCLIService } from './coderabbit-cli';
import { HeatmapService } from './heatmap';
import { HeatmapData, ReviewRequest, AlgoInput, CodeRabbitComment } from '../types';

export class PRReviewerService {
  private githubService: GitHubService;
  private codeRabbitService: CodeRabbitCLIService;
  private heatmapService: HeatmapService;

  constructor(
    githubToken: string,
    openaiApiKey: string
  ) {
    this.githubService = new GitHubService(githubToken);
    this.codeRabbitService = new CodeRabbitCLIService();
    this.heatmapService = new HeatmapService(openaiApiKey);
  }

  async generateHeatmapReview(request: ReviewRequest): Promise<HeatmapData> {
    console.log('Starting PR heatmap review...');
    
    // Parse PR URL
    const { owner, repo, pullNumber } = this.githubService.parsePRUrl(request.prUrl);
    
    // Get PR information
    const prInfo = await this.githubService.getPRInfo(owner, repo, pullNumber);
    console.log(`Analyzing PR: ${prInfo.title}`);
    
    // Get PR files
    const files = await this.githubService.getPRFiles(owner, repo, pullNumber);
    console.log(`Found ${files.length} changed files`);
    
    const heatmapData: HeatmapData = {
      prInfo,
      files: [],
      overallScore: 0,
      totalLinesChanged: 0,
      criticalIssues: 0,
      severityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
    };

    // Process each file
    for (const file of files) {
      console.log(`Processing file: ${file.filename}`);
      
      try {
        // Analyze diff for heatmap
        const algoInput: AlgoInput = {
          fileDiff: file.patch,
          filename: file.filename,
          prInfo,
        };
        
        const lines = await this.heatmapService.analyzeDiff(algoInput);
        
        // Get CodeRabbit comments if requested
        let codeRabbitComments: CodeRabbitComment[] = [];
        if (request.includeCodeRabbit) {
          try {
            // Try to get the full file content for better analysis
            let fileContent = '';
            try {
              fileContent = await this.githubService.getFileContent(owner, repo, file.filename, prInfo.headBranch);
            } catch (error) {
              console.warn(`Could not fetch full content for ${file.filename}, using patch only`);
            }

            codeRabbitComments = await this.codeRabbitService.reviewFile(
              file.filename,
              fileContent,
              file.patch
            );
          } catch (error) {
            console.warn(`CodeRabbit review failed for ${file.filename}:`, error);
            // Fallback to mock comments
            codeRabbitComments = await this.codeRabbitService.mockReviewFile(
              file.filename,
              '',
              file.patch
            );
          }
        }
        
        // Compute token scores
        const tokenScores = await this.heatmapService.computeTokenScores(lines, codeRabbitComments);
        
        // Get heatmap data with severity and colors
        const heatmapTokenScores = this.heatmapService.getHeatmapData(tokenScores);
        
        // Get severity distribution for this file
        const fileSeverityDistribution = this.heatmapService.getSeverityDistribution(tokenScores);
        
        // Update lines with severity and color
        const linesWithSeverity = lines.map(line => {
          const lineScore = line.shouldBeReviewedScore || 0;
          const { severity, color } = this.heatmapService.mapScoreToSeverity(lineScore);
          return {
            ...line,
            severity,
            color,
          };
        });
        
        heatmapData.files.push({
          filename: file.filename,
          lines: linesWithSeverity,
          tokenScores: heatmapTokenScores,
          codeRabbitComments,
          severityDistribution: fileSeverityDistribution,
        });
        
        // Update overall statistics
        heatmapData.totalLinesChanged += file.changes;
        heatmapData.criticalIssues += fileSeverityDistribution.critical;
        
        // Update overall severity distribution
        Object.keys(fileSeverityDistribution).forEach(severity => {
          heatmapData.severityDistribution[severity as keyof typeof heatmapData.severityDistribution] += 
            fileSeverityDistribution[severity as keyof typeof fileSeverityDistribution];
        });
        
      } catch (error) {
        console.error(`Error processing file ${file.filename}:`, error);
        // Add empty entry for failed files
        heatmapData.files.push({
          filename: file.filename,
          lines: [],
          tokenScores: [],
          codeRabbitComments: [],
          severityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
        });
      }
    }
    
    // Calculate overall score
    const allTokenScores = heatmapData.files.flatMap(file => file.tokenScores);
    heatmapData.overallScore = this.heatmapService.calculateOverallScore(allTokenScores);
    
    console.log('Heatmap review completed');
    console.log(`Overall score: ${heatmapData.overallScore.toFixed(2)}`);
    console.log(`Critical issues: ${heatmapData.criticalIssues}`);
    console.log('Severity distribution:', heatmapData.severityDistribution);
    
    return heatmapData;
  }

  // Get color classes for frontend
  getColorClasses() {
    return this.heatmapService.getColorClasses();
  }

  // Get severity labels
  getSeverityLabels() {
    return this.heatmapService.getSeverityLabels();
  }
}
