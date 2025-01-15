const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');

// Set up multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});

// Schema for code review
const CodeReviewSchema = new mongoose.Schema({
  selectedOptions: [{
    type: String,
    enum: ['review', 'documentation', 'comments']
  }],
  mainFile: {
    filename: String,
    content: Buffer
  },
  complianceFile: {
    filename: String,
    content: Buffer
  },
  additionalFiles: [{
    filename: String,
    content: Buffer
  }],
  modelType: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  results: {
    review: String,
    documentation: String,
    comments: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CodeReview = mongoose.model('CodeReview', CodeReviewSchema);

router.post('/analyzefile', upload.fields([
  { name: 'mainFile', maxCount: 1 },
  { name: 'complianceFile', maxCount: 1 },
  { name: 'additionalFiles', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files received:", req.files);

    const { selectedOptions, modelType, provider } = req.body;

    // Validate required fields
    if (!req.files?.mainFile?.[0]) {
      return res.status(400).json({ error: 'Main file is required' });
    }

    if (!selectedOptions || selectedOptions.length === 0) {
      return res.status(400).json({ error: 'At least one option must be selected' });
    }

    // Create new code review document
    const codeReview = new CodeReview({
      selectedOptions: JSON.parse(selectedOptions),
      modelType,
      provider,
      mainFile: {
        filename: req.files.mainFile[0].originalname,
        content: req.files.mainFile[0].buffer
      }
    });

    // Add compliance file if uploaded
    if (req.files.complianceFile?.[0]) {
      codeReview.complianceFile = {
        filename: req.files.complianceFile[0].originalname,
        content: req.files.complianceFile[0].buffer
      };
    }

    // Add additional files if uploaded
    if (req.files.additionalFiles) {
      codeReview.additionalFiles = req.files.additionalFiles.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }));
    }

    await codeReview.save();

    // Process the review asynchronously
    processReview(codeReview._id);

    res.status(201).json({
      message: 'Code review started',
      reviewId: codeReview._id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error starting code review:', error);
    res.status(500).json({ 
      error: 'Failed to start code review',
      details: error.message 
    });
  }
});

// Get review status and results
// router.get('/review/:reviewId', async (req, res) => {
//   try {
//     const review = await CodeReview.findById(req.params.reviewId);
//     if (!review) {
//       return res.status(404).json({ error: 'Review not found' });
//     }
//     res.json({
//       status: review.status,
//       results: review.results,
//       createdAt: review.createdAt
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch review status' });
//   }
// });

async function processReview(reviewId) {
  try {
    const review = await CodeReview.findById(reviewId);
    review.status = 'processing';
    await review.save();

    const results = {};
    
    // Process each selected option
    for (const option of review.selectedOptions) {
      switch (option) {
        case 'review':
          // TODO: Implement code review logic
          results.review = 'Code review results...';
          break;
        case 'documentation':
          // TODO: Implement documentation generation logic
          results.documentation = 'Generated documentation...';
          break;
        case 'comments':
          // TODO: Implement comment generation logic
          results.comments = 'Generated comments...';
          break;
      }
    }

    // Update review with results
    review.status = 'completed';
    review.results = results;
    await review.save();

  } catch (error) {
    console.error('Error processing review:', error);
    const review = await CodeReview.findById(reviewId);
    review.status = 'failed';
    await review.save();
  }
}

module.exports = router;