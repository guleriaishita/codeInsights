const express = require('express');
const router = express.Router();

router.get('/generated_guidelines_docs', (req, res) => {
  res.json({ message: 'Generated Guideline Documents' });
});

router.get('/generated_analyze_file_docs', (req, res) => {
  res.json({ message: 'Generated Analyzed Files' });
});

router.get('/knowledge_graph', (req, res) => {
  res.json({ message: 'Knowledge Graph' });
});

module.exports = router; // Ensure you export the router
