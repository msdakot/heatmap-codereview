import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PRReviewerService } from './services/reviewer';
import { ReviewRequest } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const githubToken = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!githubToken || !openaiApiKey) {
  console.error('Missing required environment variables: GITHUB_TOKEN, OPENAI_API_KEY');
  process.exit(1);
}

const reviewerService = new PRReviewerService(
  githubToken,
  openaiApiKey
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate heatmap review
app.post('/api/review', async (req, res) => {
  try {
    const request: ReviewRequest = req.body;
    
    if (!request.prUrl) {
      return res.status(400).json({ error: 'PR URL is required' });
    }

    console.log(`Generating heatmap review for: ${request.prUrl}`);
    const heatmapData = await reviewerService.generateHeatmapReview(request);
    
    res.json(heatmapData);
  } catch (error) {
    console.error('Review generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate heatmap review',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get color classes and severity labels for frontend
app.get('/api/config', (req, res) => {
  res.json({
    colorClasses: reviewerService.getColorClasses(),
    severityLabels: reviewerService.getSeverityLabels(),
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 PR Heatmap Reviewer server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 API endpoint: http://localhost:${port}/api/review`);
  console.log(`⚙️  Config endpoint: http://localhost:${port}/api/config`);
  console.log(`🤖 CodeRabbit CLI will be installed automatically on first use`);
});

export default app;
