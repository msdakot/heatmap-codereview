import { LineAnalysis, TokenScore, AlgoInput, CodeRabbitComment } from '../types';
import { LLMService } from '../utils/llm';

export type HeatmapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type HeatmapColor = 'red' | 'orange' | 'blue' | 'green';

export interface HeatmapScore {
  severity: HeatmapSeverity;
  color: HeatmapColor;
  score: number; // 0-1 for internal calculations
  reason: string | null;
}

export class HeatmapService {
  private llmService: LLMService;

  constructor(openaiApiKey: string) {
    this.llmService = new LLMService(openaiApiKey);
  }

  // Map score to severity and color
  mapScoreToSeverity(score: number): { severity: HeatmapSeverity; color: HeatmapColor } {
    if (score >= 0.8) {
      return { severity: 'critical', color: 'red' };
    } else if (score >= 0.6) {
      return { severity: 'high', color: 'orange' };
    } else if (score >= 0.4) {
      return { severity: 'medium', color: 'blue' };
    } else {
      return { severity: 'low', color: 'green' };
    }
  }

  async analyzeDiff(input: AlgoInput): Promise<LineAnalysis[]> {
    console.log('Analyzing diff for heatmap scoring...');
    
    // Truncate very large diffs to avoid token limits
    const maxDiffLength = 4000; // Leave room for prompt and response
    const truncatedDiff = input.fileDiff && input.fileDiff.length > maxDiffLength 
      ? input.fileDiff.substring(0, maxDiffLength) + '\n... [truncated]'
      : input.fileDiff;
    
    const prompt = `
      You are given a diff of a file. Analyze it and return ONLY a valid JSON object.
      
      Return format: {"lines": [{"line": "string", "hasChanged": boolean, "shouldBeReviewedScore": number, "shouldReviewWhy": "string", "mostImportantCharacterIndex": number}]}
      
      Rules:
      - Only include lines with hasChanged: true
      - shouldBeReviewedScore: 0.8-1.0 (critical), 0.6-0.79 (high), 0.4-0.59 (medium), 0.2-0.39 (low)
      - shouldReviewWhy: 4-10 words explaining why to review
      - mostImportantCharacterIndex: position of most important character
      - Focus on security, performance, complexity, code quality
      
      Diff:
      ${truncatedDiff}
    `;

    try {
      const response = await this.llmService.generateResponse(prompt, 'slow');
      
      // Try to extract JSON from response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.lines || !Array.isArray(parsed.lines)) {
        throw new Error('Invalid response format from LLM');
      }

      // Align returned changed lines to absolute file line numbers using diff hunks
      const addedLineNumbers = this.extractAddedLineNumbers(truncatedDiff || '');
      let addedIdx = 0;
      const aligned: LineAnalysis[] = parsed.lines.map((line: any) => {
        const lineNumber = addedIdx < addedLineNumbers.length ? addedLineNumbers[addedIdx++] : (addedLineNumbers[addedLineNumbers.length - 1] || 1);
        return {
          line: line.line,
          lineNumber,
          hasChanged: true,
          shouldBeReviewedScore: line.shouldBeReviewedScore,
          shouldReviewWhy: line.shouldReviewWhy,
          mostImportantCharacterIndex: line.mostImportantCharacterIndex || 0,
        } as LineAnalysis;
      });

      return aligned;
    } catch (error) {
      console.error('Error analyzing diff:', error);
      return this.fallbackAnalysis(input.fileDiff || '');
    }
  }

  async computeTokenScores(
    lines: LineAnalysis[],
    codeRabbitComments: CodeRabbitComment[] = []
  ): Promise<TokenScore[]> {
    const tokens: TokenScore[] = [];
    const splitLineIntoTokensRegex = /(?:[^a-zA-Z0-9]+|[a-zA-Z0-9]+)/g;
    let prevLineScore = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineScore = line.hasChanged ? line.shouldBeReviewedScore ?? 0 : null;
      const lineReason = line.hasChanged && lineScore && lineScore > 0.2 && line.shouldReviewWhy 
        ? line.shouldReviewWhy 
        : null;

      // Check for CodeRabbit comments on this line
      const lineComments = codeRabbitComments.filter(comment => comment.line === line.lineNumber);
      const hasCodeRabbitComments = lineComments.length > 0;

      if (line.hasChanged || hasCodeRabbitComments) {
        const lineTokens = line.line.match(splitLineIntoTokensRegex);
        if (lineTokens) {
          let tokenIndex = 0;
          for (const token of lineTokens) {
            const tokenMiddle = tokenIndex + token.length / 2;
            const ownScore = Math.min(
              Math.max((lineScore ?? 0) * (0.8 + Math.random() * 0.2), 0), 
              1
            );
            
            // Boost score if there are CodeRabbit comments
            const codeRabbitBoost = hasCodeRabbitComments ? 0.2 : 0;
            const finalScore = Math.min(ownScore + codeRabbitBoost, 1);
            
            const lastLineScoreInfluence = Math.abs(tokenMiddle - line.mostImportantCharacterIndex) / line.line.length / 2;
            let score = (1 - lastLineScoreInfluence) * finalScore + lastLineScoreInfluence * prevLineScore;
            
            // Only include tokens with meaningful scores (>= 0.2)
            if (score >= 0.2) {
              tokens.push({
                token,
                score,
                reason: lineReason || (hasCodeRabbitComments ? 'AI review comment' : null),
                lineNumber: line.lineNumber,
                characterIndex: tokenIndex,
              });
            } else {
              tokens.push({
                token,
                score: null,
                reason: null,
                lineNumber: line.lineNumber,
                characterIndex: tokenIndex,
              });
            }
            
            tokenIndex += token.length;
          }
        }
      } else {
        tokens.push({
          token: line.line,
          score: null,
          reason: null,
          lineNumber: line.lineNumber,
          characterIndex: 0,
        });
      }

      tokens.push({
        token: '\n',
        score: null,
        reason: null,
        lineNumber: line.lineNumber,
        characterIndex: line.line.length,
      });

      prevLineScore = lineScore ?? 0;
    }

    return tokens;
  }

  // Get heatmap data with severity and color mapping
  getHeatmapData(tokenScores: TokenScore[]): TokenScore[] {
    return tokenScores.map(token => {
      if (token.score === null) {
        return {
          ...token,
          severity: 'low' as HeatmapSeverity,
          color: 'green' as HeatmapColor,
        };
      }

      const { severity, color } = this.mapScoreToSeverity(token.score);
      return {
        ...token,
        severity,
        color,
      };
    });
  }

  // Get severity distribution
  getSeverityDistribution(tokenScores: TokenScore[]): Record<HeatmapSeverity, number> {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    
    tokenScores.forEach(token => {
      if (token.score !== null) {
        const { severity } = this.mapScoreToSeverity(token.score);
        distribution[severity]++;
      }
    });

    return distribution;
  }

  // Get color CSS classes for frontend
  getColorClasses(): Record<HeatmapColor, string> {
    return {
      red: 'bg-red-500 text-white',
      orange: 'bg-orange-500 text-white', 
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
    };
  }

  // Get severity labels
  getSeverityLabels(): Record<HeatmapSeverity, string> {
    return {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium', 
      low: 'Low',
    };
  }

  private fallbackAnalysis(diff: string): LineAnalysis[] {
    const lines = diff.split('\n');
    const addedLineNumbers = this.extractAddedLineNumbers(diff);
    let addedIdx = 0;
    return lines.map((line) => {
      const isAdd = line.startsWith('+');
      const withoutPrefix = isAdd || line.startsWith('-') || line.startsWith(' ') ? line.slice(1) : line;
      const lineNumber = isAdd && addedIdx < addedLineNumbers.length ? addedLineNumbers[addedIdx++] : (addedIdx > 0 ? addedLineNumbers[Math.min(addedIdx - 1, addedLineNumbers.length - 1)] : 1);
      return {
        line: withoutPrefix,
        lineNumber,
        hasChanged: isAdd,
        shouldBeReviewedScore: isAdd ? 0.5 : undefined,
        shouldReviewWhy: isAdd ? 'new code added' : undefined,
        mostImportantCharacterIndex: Math.floor(withoutPrefix.length / 2),
      } as LineAnalysis;
    });
  }

  // Parse unified diff hunks and return absolute new-file line numbers for all added ('+') lines in order
  private extractAddedLineNumbers(diff: string): number[] {
    const lines = diff.split('\n');
    let newLine = 0;
    let oldLine = 0;
    const result: number[] = [];
    const hunkRegex = /^@@\s-([0-9]+)(?:,([0-9]+))?\s\+([0-9]+)(?:,([0-9]+))?\s@@/;

    for (const raw of lines) {
      const line = raw;
      const hunk = line.match(hunkRegex);
      if (hunk) {
        oldLine = parseInt(hunk[1], 10);
        newLine = parseInt(hunk[3], 10);
        continue;
      }
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
        continue;
      }
      if (line.startsWith(' ')) {
        oldLine += 1;
        newLine += 1;
        continue;
      }
      if (line.startsWith('-')) {
        oldLine += 1;
        continue;
      }
      if (line.startsWith('+')) {
        result.push(newLine);
        newLine += 1;
        continue;
      }
      // other lines (e.g., truncated marker)
    }
    return result;
  }

  calculateOverallScore(tokenScores: TokenScore[]): number {
    const scoredTokens = tokenScores.filter(token => token.score !== null);
    if (scoredTokens.length === 0) return 0;

    const totalScore = scoredTokens.reduce((sum, token) => sum + (token.score || 0), 0);
    return totalScore / scoredTokens.length;
  }

  getCriticalIssuesCount(tokenScores: TokenScore[]): number {
    return tokenScores.filter(token => (token.score || 0) >= 0.8).length;
  }
}
