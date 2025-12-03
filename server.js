const express = require('express');
const { spawn } = require('child_process');
const app = express();

// Middleware to parse JSON bodies (optional, for future POST requests)
app.use(express.json());



// Endpoint to send question to Python script
app.get("/home", (req, res) => {
  res.send("home");
})

app.get('/ask', (req, res) => {
  const question = req.query.q;
  
  if (!question) {
    return res.status(400).json({ error: 'Missing ?q=question parameter' });
  }

  // Send JSON input to Python: { "question": "..." }
  const inputJson = JSON.stringify({ question: question });
  
  console.log(`Calling Python with: ${question}`);
  
  // Use 'py' launcher (Windows) or specify full path
  const pythonProcess = spawn('py', ['chatbot.py', inputJson]);

  let result = '';

  // Collect stdout data from Python (JSON response)
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  // Log Python errors
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code: ${code}`);
    
    if (code !== 0) {
      return res.status(500).json({ 
        error: `Python script exited with code ${code}`,
        stderr: result 
      });
    }

    try {
      // Parse JSON response from Python
      const response = JSON.parse(result.trim());
      res.json(response);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).json({ 
        error: 'Failed to parse Python JSON response',
        raw: result.trim()
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: process.env.PORT });
});

///ask?q=What%20are%20flu%20symptoms?
