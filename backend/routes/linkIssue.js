const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  const { from, to, type } = req.body;
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  if (!from || !to || !type) {
    return res.status(400).json({ error: 'Missing from, to, or type in request body' });
  }
  // Only support 'blocks' and 'is blocked by'
  let linkType, inwardIssue, outwardIssue;
  if (type === 'blocks') {
    linkType = 'Blocks';
    outwardIssue = to;
    inwardIssue = from;
  } else if (type === 'is blocked by') {
    linkType = 'Blocks';
    outwardIssue = from;
    inwardIssue = to;
  } else {
    return res.status(400).json({ error: 'Invalid link type' });
  }
  try {
    const url = `https://${JIRA_DOMAIN}/rest/api/3/issueLink`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: { name: linkType },
        inwardIssue: { key: inwardIssue },
        outwardIssue: { key: outwardIssue },
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Failed to create issue link in Jira', details: errorText });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error creating issue link in Jira', details: err.message });
  }
});

module.exports = router; 