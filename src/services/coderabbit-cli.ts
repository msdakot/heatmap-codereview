import { exec } from 'child_process';
import { promisify } from 'util';
import { CodeRabbitComment, FileDiff, PRInfo } from '../types';

const execAsync = promisify(exec);
const EXEC_TIMEOUT_MS = 60000; // 60s safety timeout

export class CodeRabbitCLIService {
  private isInstalled: boolean = false;

  constructor() {
    this.checkInstallation();
  }

  private async checkInstallation(): Promise<void> {
    try {
      await execAsync('coderabbit --version', { timeout: EXEC_TIMEOUT_MS });
      this.isInstalled = true;
      console.log('CodeRabbit CLI is installed');
    } catch (error) {
      console.log('CodeRabbit CLI not found, will install automatically');
      this.isInstalled = false;
    }
  }

  async installCodeRabbit(): Promise<void> {
    if (this.isInstalled) return;

    try {
      console.log('Installing CodeRabbit CLI...');
      await execAsync('curl -fsSL https://cli.coderabbit.ai/install.sh | sh', { timeout: EXEC_TIMEOUT_MS });
      this.isInstalled = true;
      console.log('CodeRabbit CLI installed successfully');
    } catch (error) {
      console.error('Failed to install CodeRabbit CLI:', error);
      throw new Error('Failed to install CodeRabbit CLI');
    }
  }

  async reviewPR(prInfo: PRInfo, files: FileDiff[]): Promise<CodeRabbitComment[]> {
    if (!this.isInstalled) {
      await this.installCodeRabbit();
    }

    try {
      // Create a temporary directory for the PR files
      const tempDir = `/tmp/coderabbit-review-${Date.now()}`;
      await execAsync(`mkdir -p ${tempDir}`, { timeout: EXEC_TIMEOUT_MS });

      // Write each file to the temp directory
      for (const file of files) {
        if (file.patch) {
          const filePath = `${tempDir}/${file.filename}`;
          const dir = filePath.substring(0, filePath.lastIndexOf('/'));
          await execAsync(`mkdir -p ${dir}`, { timeout: EXEC_TIMEOUT_MS });
          // Write safely via base64 to avoid quoting/escaping issues
          const b64 = Buffer.from(file.patch, 'utf8').toString('base64');
          await execAsync(`echo ${b64} | base64 --decode > ${filePath}`, { timeout: EXEC_TIMEOUT_MS });
        }
      }

      // Run CodeRabbit review from within the directory (no file arguments)
      const { stdout, stderr } = await execAsync(`cd ${tempDir} && coderabbit review --plain`, { timeout: EXEC_TIMEOUT_MS });

      // Clean up temp directory
      await execAsync(`rm -rf ${tempDir}`, { timeout: EXEC_TIMEOUT_MS });

      if (stderr) {
        console.warn('CodeRabbit CLI warnings:', stderr);
      }

      return this.parseTextOutput(stdout);
    } catch (error) {
      console.error('CodeRabbit CLI error:', error);
      return [];
    }
  }

  async reviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]> {
    if (!this.isInstalled) {
      await this.installCodeRabbit();
    }

    try {
      // Create a temporary directory with the file
      const tempDir = `/tmp/coderabbit-file-${Date.now()}`;
      const tempFile = `${tempDir}/${filename}`;
      const dir = tempFile.substring(0, tempFile.lastIndexOf('/'));
      
      await execAsync(`mkdir -p ${dir}`, { timeout: EXEC_TIMEOUT_MS });
      const b64 = Buffer.from(content, 'utf8').toString('base64');
      await execAsync(`echo ${b64} | base64 --decode > ${tempFile}`, { timeout: EXEC_TIMEOUT_MS });

      // Run CodeRabbit review from within the directory (no file arguments)
      const { stdout, stderr } = await execAsync(`cd ${tempDir} && coderabbit review --plain`, { timeout: EXEC_TIMEOUT_MS });

      // Clean up temp directory
      await execAsync(`rm -rf ${tempDir}`, { timeout: EXEC_TIMEOUT_MS });

      if (stderr) {
        console.warn('CodeRabbit CLI warnings:', stderr);
      }

      return this.parseTextOutput(stdout);
    } catch (error) {
      console.error('CodeRabbit file review error:', error);
      return [];
    }
  }

  private parseTextOutput(output: string): CodeRabbitComment[] {
    const comments: CodeRabbitComment[] = [];
    const lines = output.split('\n');
    let currentComment: Partial<CodeRabbitComment> = {};

    for (const line of lines) {
      if (line.includes('Issue:') || line.includes('Recommendation:') || line.includes('🔍') || line.includes('⚠️')) {
        if (currentComment.body) {
          comments.push({
            id: Math.random().toString(36).substr(2, 9),
            path: currentComment.path || '',
            line: currentComment.line || 1,
            body: currentComment.body,
            severity: currentComment.severity || 'info',
            suggestion: currentComment.suggestion || '',
            category: currentComment.category || 'general',
          });
        }
        currentComment = {};
      }

      if (line.includes('File:')) {
        currentComment.path = line.split('File:')[1]?.trim();
      } else if (line.includes('Line:')) {
        currentComment.line = parseInt(line.split('Line:')[1]?.trim() || '1');
      } else if (line.includes('Severity:')) {
        currentComment.severity = this.mapSeverity(line.split('Severity:')[1]?.trim());
      } else if (line.includes('Message:') || line.includes('Description:')) {
        currentComment.body = line.split(/Message:|Description:/)[1]?.trim();
      } else if (line.includes('Suggestion:') || line.includes('Fix:')) {
        currentComment.suggestion = line.split(/Suggestion:|Fix:/)[1]?.trim();
      } else if (line.includes('Category:')) {
        currentComment.category = line.split('Category:')[1]?.trim();
      } else if (line.trim() && !line.includes('CodeRabbit') && !line.includes('Review')) {
        // This might be a comment body
        if (!currentComment.body) {
          currentComment.body = line.trim();
        }
      }
    }

    // Add the last comment if exists
    if (currentComment.body) {
      comments.push({
        id: Math.random().toString(36).substr(2, 9),
        path: currentComment.path || '',
        line: currentComment.line || 1,
        body: currentComment.body,
        severity: currentComment.severity || 'info',
        suggestion: currentComment.suggestion || '',
        category: currentComment.category || 'general',
      });
    }

    return comments;
  }

  private mapSeverity(severity: string): 'info' | 'warning' | 'error' {
    if (!severity) return 'info';
    
    const s = severity.toLowerCase();
    if (s.includes('error') || s.includes('critical') || s.includes('high')) {
      return 'error';
    } else if (s.includes('warning') || s.includes('medium')) {
      return 'warning';
    } else {
      return 'info';
    }
  }

  // Mock implementation for development/testing when CLI is not available
  async mockReviewFile(filename: string, content: string, patch: string): Promise<CodeRabbitComment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const comments: CodeRabbitComment[] = [];
    const lines = content.split('\n');

    // Generate mock comments based on common patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for potential issues
      if (line.includes('TODO') || line.includes('FIXME')) {
        comments.push({
          id: `mock-${i}`,
          path: filename,
          line: i + 1,
          body: 'Consider addressing this TODO/FIXME comment',
          severity: 'warning',
          suggestion: 'Complete the implementation or remove the comment',
          category: 'maintainability',
        });
      }

      if (line.includes('console.log') || line.includes('console.error')) {
        comments.push({
          id: `mock-${i}-log`,
          path: filename,
          line: i + 1,
          body: 'Debug logging should be removed in production',
          severity: 'info',
          suggestion: 'Use a proper logging framework or remove debug statements',
          category: 'maintainability',
        });
      }

      if (line.length > 120) {
        comments.push({
          id: `mock-${i}-length`,
          path: filename,
          line: i + 1,
          body: 'Line is too long and may be hard to read',
          severity: 'warning',
          suggestion: 'Break this line into multiple lines',
          category: 'readability',
        });
      }
    }

    return comments;
  }
}
