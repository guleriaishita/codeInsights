// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const mongoose = require('mongoose');
// const generate_guideline_codebase = require('../util/main.py')

// // Set up multer with memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
//   }
// });

// // Schema for guidelines
// const GuidelineSchema = new mongoose.Schema({
//   type: String,  // 'codebase' or 'files'
//   provider: String,
//   modelType: String,
//   status: {
//     type: String,
//     enum: ['pending', 'processing', 'completed', 'failed'],
//     default: 'pending'
//   },
//   result: String,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Guideline = mongoose.model('Guideline', GuidelineSchema);

// router.post('/generate_guidelines', upload.array('files'), async (req, res) => {
//     try {
//       console.log("Request body:", req.body);
//       console.log("Files received:", req.files?.length || 0);
  
//       // Check if files were received
//       if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ error: 'No files were uploaded' });
//       }
  
//       const { selectedOption, provider, modelType } = req.body;
      
//       // Map the files
//       const files = req.files.map(file => ({
//         buffer: file.buffer,
//         originalname: file.originalname,
//         mimetype: file.mimetype
//       }));
  
//       // Create new guideline document
//       const guideline = new Guideline({
//         type: selectedOption,
//         provider,
//         modelType,
//         status: 'pending'
//       });
  
//       await guideline.save();
  
//       // Process files immediately
//       processFiles(files, guideline._id, provider, modelType);
  
//       res.status(201).json({
//         message: 'Guidelines generation started',
//         guidelineId: guideline._id,
//         filesProcessed: files.length
//       });
  
//     } catch (error) {
//       console.error('Error generating guidelines:', error);
//       res.status(500).json({ 
//         error: 'Failed to generate guidelines',
//         details: error.message 
//       });
//     }
//   });

// // Function to process files in memory
// async function processFiles(files, guidelineId, provider, modelType) {
//   try {
//     const guideline = await Guideline.findById(guidelineId);
//     guideline.status = 'processing';
//     await guideline.save();

//     // Process files from memory
//     const fileContents = files.map(file => {
//       return {
//         content: file.buffer.toString('utf-8'),
//         filename: file.originalname
//       };
//     });

//     // TODO: Implement your AI processing logic here
//     // You can directly use fileContents array which contains the file contents
//     // Process with GPT or other AI services
    
//     // Simulate processing time
//     await new Promise(resolve => setTimeout(resolve, 5000));
    
//     // Example processing result
//     const processedResult = `Processed ${files.length} files:\n` +
//       fileContents.map(f => `- ${f.filename}`).join('\n');

//     // Update guideline with result
//     guideline.status = 'completed';
//     guideline.result = processedResult;
//     await guideline.save();

//   } catch (error) {
//     console.error('Error processing files:', error);
//     const guideline = await Guideline.findById(guidelineId);
//     guideline.status = 'failed';
//     await guideline.save();
//   }
// }

// module.exports = router;




const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');

// Set up multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});

// Schema for guidelines
const GuidelineSchema = new mongoose.Schema({
  type: String,  // 'codebase' or 'files'
  provider: String,
  modelType: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  result: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Guideline = mongoose.model('Guideline', GuidelineSchema);

// Function to execute Python script and return promise
function executePythonScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../util', 'main.py'),
      ...args
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${error}`));
      } else {
        try {
          resolve(JSON.parse(result));
        } catch {
          resolve(result);
        }
      }
    });
  });
}

// Function to process files in memory
async function processFiles(files, guidelineId, provider, modelType) {
  try {
    const guideline = await Guideline.findById(guidelineId);
    guideline.status = 'processing';
    await guideline.save();

    // First get the config
    const configResult = await executePythonScript('main.py', ['litellmconfig']);
    
    // Process files and prepare data for Python script
    const fileContents = files.map(file => ({
      content: file.buffer.toString('utf-8'),
      filename: file.originalname
    }));

    // Call generate_guideline_document with the data and config
    const processedResult = await executePythonScript('main.py', [
      'generate_guideline_document',
      JSON.stringify({
        files: fileContents,
        config: configResult,
        provider: provider,
        modelType: modelType
      })
    ]);

    // Update guideline with result
    guideline.status = 'completed';
    guideline.result = processedResult;
    await guideline.save();

  } catch (error) {
    console.error('Error processing files:', error);
    const guideline = await Guideline.findById(guidelineId);
    guideline.status = 'failed';
    guideline.result = error.message;
    await guideline.save();
  }
}

router.post('/generate_guidelines', upload.array('files'), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files received:", req.files?.length || 0);

    // Check if files were received
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const { selectedOption, provider, modelType } = req.body;

    // Map the files
    const files = req.files.map(file => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype
    }));

    // Create new guideline document
    const guideline = new Guideline({
      type: selectedOption,
      provider,
      modelType,
      status: 'pending'
    });

    await guideline.save();

    // Process files immediately
    processFiles(files, guideline._id, provider, modelType);

    res.status(201).json({
      message: 'Guidelines generation started',
      guidelineId: guideline._id,
      filesProcessed: files.length
    });

  } catch (error) {
    console.error('Error generating guidelines:', error);
    res.status(500).json({
      error: 'Failed to generate guidelines',
      details: error.message
    });
  }
});

module.exports = router;






