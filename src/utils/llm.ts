import OpenAI from 'openai';

export class LLMService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateResponse(prompt: string, mode: 'fast' | 'slow' = 'fast'): Promise<string> {
    const model = mode === 'slow' ? 'gpt-4' : 'gpt-3.5-turbo';
    
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Analyze code changes and provide detailed feedback with appropriate scoring.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent scoring
        max_tokens: 4000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate LLM response');
    }
  }

  async analyzeCodeQuality(code: string, context?: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `
      Analyze the following code for quality issues and provide a score from 0-1.
      
      ${context ? `Context: ${context}` : ''}
      
      Code:
      ${code}
      
      Return a JSON object with:
      - score: number (0-1, where 1 is perfect)
      - issues: string[] (list of problems found)
      - suggestions: string[] (list of improvement suggestions)
    `;

    try {
      const response = await this.generateResponse(prompt, 'slow');
      return JSON.parse(response);
    } catch (error) {
      console.error('Code quality analysis error:', error);
      return {
        score: 0.5,
        issues: ['Analysis failed'],
        suggestions: ['Manual review recommended'],
      };
    }
  }
}
