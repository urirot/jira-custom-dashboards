const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  const { key } = req.body;
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  if (!key) {
    return res.status(400).json({ error: 'Missing ticket key' });
  }
  try {
    // Fetch all issue links for the ticket
    const url = `https://${JIRA_DOMAIN}/rest/api/3/issue/${key}?fields=issuelinks`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch issue from Jira' });
    }
    const data = await response.json();
    const links = (data.fields.issuelinks || []);
    // For each link, delete it
    for (const link of links) {
      if (!link.id) continue;
      const delUrl = `https://${JIRA_DOMAIN}/rest/api/3/issueLink/${link.id}`;
      await fetch(delUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });
      // Ignore errors for individual links
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting links from Jira', details: err.message });
  }
});

module.exports = router; 