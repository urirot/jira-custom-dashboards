const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  try {
    const url = `https://${JIRA_DOMAIN}/rest/api/3/project/search`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch projects from Jira' });
    }
    const data = await response.json();
    // Return only key and name for each project
    const projects = (data.values || []).map(project => ({
      key: project.key,
      name: project.name,
    }));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching projects from Jira', details: err.message });
  }
});

module.exports = router; 