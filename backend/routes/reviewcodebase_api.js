const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const CodebaseReview = require('../models/CodebaseReview'); // Make sure this import is correct

// Set up multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
}).fields([
  { name: 'codebaseFolder', maxCount: 10 },
  { name: 'complianceFile', maxCount: 1 }
]);

router.post('/analyzecodebase', (req, res) => {
  upload(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: err.message || 'File upload error'
        });
      } else if (err) {
        return res.status(500).json({
          error: 'Server error during file upload'
        });
      }

      // Validate request
      if (!req.files?.codebaseFolder || req.files.codebaseFolder.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded'
        });
      }

      if (!req.body.modelType || !req.body.provider) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      // Create new codebase review document
      const codebaseReview = new CodebaseReview({
        modelType: req.body.modelType,
        provider: req.body.provider,
        selectedOptions: ['review', 'documentation', 'comments'],
        mainFile: {
          filename: req.files.codebaseFolder[0].originalname,
          relativePath: req.files.codebaseFolder[0].originalname,
          content: req.files.codebaseFolder[0].buffer,
          size: req.files.codebaseFolder[0].size
        },
        codebaseFiles: req.files.codebaseFolder.slice(1).map(file => ({
          filename: file.originalname,
          relativePath: file.originalname,
          content: file.buffer,
          size: file.size
        })),
        totalFiles: req.files.codebaseFolder.length
      });

      // Add compliance file if uploaded
      if (req.files.complianceFile?.[0]) {
        codebaseReview.complianceFile = {
          filename: req.files.complianceFile[0].originalname,
          content: req.files.complianceFile[0].buffer,
          size: req.files.complianceFile[0].size
        };
      }

      await codebaseReview.save();

      // Start processing (async)
      processCodebaseReview(codebaseReview._id).catch(console.error);

      // Send response
      return res.status(201).json({
        success: true,
        message: 'Codebase review started',
        data: {
          reviewId: codebaseReview._id,
          status: 'pending',
          totalFiles: codebaseReview.totalFiles
        }
      });

    } catch (error) {
      console.error('Error in /analyzecodebase:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

// Process the codebase review
async function processCodebaseReview(reviewId) {
  try {
    const review = await CodebaseReview.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    review.status = 'processing';
    await review.save();

    // Perform analysis
    const analysisMetrics = {
      complexityScore: 0, // Implement your analysis logic
      codeQualityScore: 0,
      complianceScore: review.complianceFile ? 0 : null,
      testCoverage: 0
    };

    // Update analysis metrics
    review.analysisMetrics = analysisMetrics;

    // Process each selected option
    const results = {};
    for (const option of review.selectedOptions) {
      switch (option) {
        case 'review':
          results.review = 'Code review results...'; // Implement your review logic
          break;
        case 'documentation':
          results.documentation = 'Generated documentation...'; // Implement your documentation logic
          break;
        case 'comments':
          results.comments = 'Generated comments...'; // Implement your comment generation logic
          break;
      }
    }

    // Update review with results
    review.status = 'completed';
    review.results = results;
    await review.save();

  } catch (error) {
    console.error('Error processing review:', error);
    const review = await CodebaseReview.findById(reviewId);
    if (review) {
      review.status = 'failed';
      await review.save();
    }
  }
}

module.exports = router;
