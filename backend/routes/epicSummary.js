const express = require('express');
const router = express.Router();

// This route will be enhanced to use Jira MCP in the future
// For now, it returns a placeholder that the frontend will handle
router.get('/:epicKey', async (req, res) => {
  try {
    const { epicKey } = req.params;
    const { project } = req.query;

    // Placeholder response - the frontend will calculate metrics from the epic data
    const summary = {
      epicKey,
      epicName: `Epic ${epicKey}`,
      message: 'Metrics calculated on frontend from epic data',
      estimationData: {
        onTimePercentage: 0,
        overTimePercentage: 0,
        totalEstimatedDays: 0,
        totalActualDays: 0,
        efficiencyPercentage: 0,
        ticketPerformance: []
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching epic summary:', error);
    res.status(500).json({ error: 'Failed to fetch epic summary' });
  }
});

module.exports = router;
