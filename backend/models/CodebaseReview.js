// models/CodebaseReview.js

const mongoose = require('mongoose');

const codebaseReviewSchema = new mongoose.Schema({
  modelType: { type: String, required: true },
  provider: { type: String, required: true },
  selectedOptions: [String],
  mainFile: {
    filename: { type: String, required: true },
    relativePath: { type: String, required: true },
    content: { type: Buffer, required: true },
    size: { type: Number, required: true }
  },
  codebaseFiles: [
    {
      filename: { type: String, required: true },
      relativePath: { type: String, required: true },
      content: { type: Buffer, required: true },
      size: { type: Number, required: true }
    }
  ],
  totalFiles: { type: Number, required: true },
  complianceFile: {
    filename: { type: String },
    content: { type: Buffer },
    size: { type: Number }
  },
  status: { type: String, default: 'pending' },
  analysisMetrics: {
    complexityScore: { type: Number },
    codeQualityScore: { type: Number },
    complianceScore: { type: Number },
    testCoverage: { type: Number }
  },
  results: Object
}, { timestamps: true });


const CodebaseReview = mongoose.model('CodebaseReview', codebaseReviewSchema);

module.exports = CodebaseReview;