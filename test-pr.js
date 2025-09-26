const axios = require('axios');

async function testPRReview() {
  const prUrl = 'https://github.com/SylphAI-Inc/AdalFlow/pull/448';
  
  console.log('🚀 Testing PR Heatmap Reviewer...');
  console.log(`📋 Analyzing PR: ${prUrl}`);
  
  try {
    const response = await axios.post('http://localhost:3000/api/review', {
      prUrl: prUrl,
      includeCodeRabbit: true
    });
    
    const data = response.data;
    
    console.log('\n✅ Analysis Complete!');
    console.log(`📊 Overall Score: ${data.overallScore.toFixed(2)}`);
    console.log(`🔴 Critical Issues: ${data.criticalIssues}`);
    console.log(`📝 Total Lines Changed: ${data.totalLinesChanged}`);
    console.log(`📁 Files Analyzed: ${data.files.length}`);
    
    console.log('\n📈 Severity Distribution:');
    console.log(`  Critical: ${data.severityDistribution.critical}`);
    console.log(`  High: ${data.severityDistribution.high}`);
    console.log(`  Medium: ${data.severityDistribution.medium}`);
    console.log(`  Low: ${data.severityDistribution.low}`);
    
    console.log('\n📄 File Details:');
    data.files.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.filename}`);
      console.log(`   Lines: ${file.lines.length}`);
      console.log(`   Critical: ${file.severityDistribution.critical}`);
      console.log(`   High: ${file.severityDistribution.high}`);
      console.log(`   Medium: ${file.severityDistribution.medium}`);
      console.log(`   Low: ${file.severityDistribution.low}`);
      
      // Show some highlighted lines
      const highlightedLines = file.lines.filter(line => line.hasChanged && line.severity);
      if (highlightedLines.length > 0) {
        console.log(`   \n   🎯 Sample highlighted lines:`);
        highlightedLines.slice(0, 3).forEach(line => {
          const score = ((line.shouldBeReviewedScore || 0) * 100).toFixed(0);
          console.log(`   ${line.severity?.toUpperCase()} (${score}%): ${line.line.substring(0, 60)}...`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start it with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testPRReview();
  }
}

main();
