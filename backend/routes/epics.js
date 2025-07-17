const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  const project = req.query.project || 'TARANIS PRODUCT';
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  try {
    // Fetch all epics for the project by creation date, excluding 'Archived' and 'Done' statuses
    let startAt = 0;
    const maxResults = 100;
    let allIssues = [];
    let total = 0;
    do {
      const jql = encodeURIComponent(`project = "${project}" AND issuetype=Epic AND status NOT IN ("Archived", "Done") ORDER BY created DESC`);
      const url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary,customfield_10465,customfield_10011,status&maxResults=${maxResults}&startAt=${startAt}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jira API error for /api/epics:', { url, status: response.status, errorText });
        return res.status(500).json({ error: 'Failed to fetch epics from Jira', details: errorText });
      }
      const data = await response.json();
      if (!(data.issues && data.issues.length)) {
        break;
      }
      allIssues = allIssues.concat(data.issues);
      total = data.total;
      startAt += data.issues.length;
    } while (allIssues.length < total);
    // Return all epics for the project
    const epics = allIssues.map(issue => ({
      key: issue.key,
      name: issue.fields.summary,
      epicName: issue.fields.customfield_10011 || null,
      team: issue.fields.customfield_10465 || null,
    }));
    res.json(epics);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching epics from Jira', details: err.message });
  }
});

module.exports = router; 