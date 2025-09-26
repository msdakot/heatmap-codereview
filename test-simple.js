const axios = require('axios');

async function testHeatmap() {
  try {
    console.log('Testing heatmap API...');
    
    const response = await axios.post('http://localhost:3000/api/review', {
      prUrl: 'https://github.com/SylphAI-Inc/AdalFlow/pull/448',
      includeCodeRabbit: false
    }, {
      timeout: 120000, // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('Request timed out after 2 minutes');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testHeatmap();
