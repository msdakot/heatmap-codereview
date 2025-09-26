const axios = require('axios');

async function debugHeatmap() {
  try {
    console.log('Fetching heatmap data...');
    
    const response = await axios.post('http://localhost:3000/api/review', {
      prUrl: 'https://github.com/SylphAI-Inc/AdalFlow/pull/448',
      includeCodeRabbit: false
    });
    
    const heatmapData = response.data;
    
    console.log('\n=== FILES IN HEATMAP DATA ===');
    heatmapData.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.filename}`);
      console.log(`   Lines with changes: ${file.lines.filter(l => l.hasChanged).length}`);
      console.log(`   Severity distribution:`, file.severityDistribution);
    });
    
    console.log('\n=== CURRENT FILE PATH TEST ===');
    const currentFilePath = '/Users/dkothari2/Desktop/hackathons/awsBuilder/AdalFlow/adalflow/adalflow/components/model_client/bedrock_client.py';
    console.log(`Current file: ${currentFilePath}`);
    
    const matchingFile = heatmapData.files.find(f => currentFilePath.includes(f.filename));
    console.log(`Matching file found: ${matchingFile ? matchingFile.filename : 'NONE'}`);
    
    if (matchingFile) {
      console.log('\n=== MATCHING FILE DETAILS ===');
      console.log(`Lines with changes: ${matchingFile.lines.filter(l => l.hasChanged).length}`);
      console.log(`Sample lines:`);
      matchingFile.lines.filter(l => l.hasChanged).slice(0, 5).forEach(line => {
        console.log(`  Line ${line.lineNumber}: ${line.line.substring(0, 50)}... (${line.severity})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugHeatmap();
