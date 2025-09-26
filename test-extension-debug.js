const axios = require('axios');

async function testExtensionDebug() {
  try {
    console.log('=== Testing API Connection ===');
    const response = await axios.post('http://localhost:3000/api/review', {
      prUrl: 'https://github.com/SylphAI-Inc/AdalFlow/pull/448',
      includeCodeRabbit: false
    });
    
    console.log('✅ API call successful');
    console.log('Files found:', response.data.files.length);
    
    const bedrockFile = response.data.files.find(f => f.filename.includes('bedrock_client.py'));
    if (bedrockFile) {
      console.log('✅ Bedrock file found:', bedrockFile.filename);
      console.log('Lines with changes:', bedrockFile.lines.filter(l => l.hasChanged).length);
      console.log('Severity distribution:', bedrockFile.severityDistribution);
      
      // Show sample lines
      console.log('\n=== Sample Lines ===');
      bedrockFile.lines.filter(l => l.hasChanged).slice(0, 3).forEach(line => {
        console.log(`Line ${line.lineNumber}: ${line.line.substring(0, 60)}... (${line.severity})`);
      });
    } else {
      console.log('❌ Bedrock file not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExtensionDebug();
