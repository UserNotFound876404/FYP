const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT= 8099;


// Middleware to parse JSON bodies (optional, for future POST requests)
app.use(express.json());



// Endpoint to send question to Python script
app.get("/home", (req, res) => {
  res.status(200).send("home");
})

app.get('/ask', (req, res) => {
  const question = req.query.q;
  
  if (!question) {
    return res.status(400).json({ error: 'Missing ?q=question parameter' });
  }

  // Send JSON input to Python: { "question": "..." }
  const inputJson = JSON.stringify({ question: question });
  
  console.log(`Calling Python with: ${question}`);
  
  // Use correct Python command (py for Windows localhost, python3 for Azure)
  const pythonProcess = spawn('python3', ['chatbot.py', inputJson]);

  let result = '';
  let stderr = '';  // ✅ Capture ALL stderr

  // Collect stdout data from Python (JSON response)
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  // ✅ Log AND capture Python errors
  pythonProcess.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    console.error(`Python ERROR: ${errorMsg}`);
    stderr += errorMsg; 
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code: ${code}`);
    console.log(`STDOUT: ${result.trim()}`);
    console.log(`STDERR: ${stderr.trim()}`);
    
    if (code !== 0) {
      return res.status(500).json({ 
        error: `Python script failed (exit code ${code})`,
        stdout: result.trim(),
        stderr: stderr.trim()  
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
        rawOutput: result.trim(),
        stderr: stderr.trim()
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: process.env.PORT });
});

app.listen(process.env.PORT || 8099);

///ask?q=What%20are%20flu%20symptoms?
//python3 -m pip install --user --break-system-packages openai python-dotenv
