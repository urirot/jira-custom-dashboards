const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = require('node-fetch');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies

let issueToSprintMap = {};
let lastSprintFetch = 0;
const SPRINT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Remove refreshSprintMapping and related logic

// Remove setInterval(refreshSprintMapping, SPRINT_CACHE_TTL);

app.get('/api/epic/:id', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  const epicKey = req.params.id;
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  try {
    // JQL for all issues in the Epic
    const jql = encodeURIComponent(`(("Team[Dropdown]" = Applications) OR labels in (Applications, applications)) AND project = "TARANIS PRODUCT" AND status in ("To Do", "Ready For Sprint", "In Progress", QA, Completed, Accepted, Approved, Released) AND "Epic Link" = ${epicKey} ORDER BY Rank ASC`);
    const url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary,issuetype,status,issuelinks,assignee,customfield_10014`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch issues for Epic from Jira' });
    }
    const data = await response.json();

    // JQL for all issues in open sprints (customized)
    const openSprintJql = encodeURIComponent('"Team[Dropdown]" = Applications AND status not in (Product, UX) AND Sprint in openSprints() ORDER BY cf[10005] DESC, assignee ASC');
    const openSprintUrl = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${openSprintJql}&fields=key`;
    const openSprintResp = await fetch(openSprintUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });
    let openSprintKeys = [];
    if (openSprintResp.ok) {
      const openSprintData = await openSprintResp.json();
      openSprintKeys = (openSprintData.issues || []).map(issue => issue.key);
    }

    const tickets = (data.issues || []).map(issue => {
      return {
        key: issue.key,
        summary: issue.fields.summary,
        type: issue.fields.issuetype.name,
        status: issue.fields.status.name,
        blocks: (issue.fields.issuelinks || []).filter(l => l.type && l.type.name === 'Blocks' && l.outwardIssue).map(l => l.outwardIssue.key),
        blockedBy: (issue.fields.issuelinks || []).filter(l => l.type && l.type.name === 'Blocks' && l.inwardIssue).map(l => l.inwardIssue.key),
        isCurrentSprint: openSprintKeys.includes(issue.key),
        assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
        storyPoints: issue.fields.customfield_10014 || null,
      };
    });
    res.json({
      epicId: epicKey,
      epicName: epicKey, // Optionally fetch Epic summary if needed
      tickets,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching issues for Epic from Jira', details: err.message });
  }
});

// Endpoint to fetch all epics (mock for now)
app.get('/api/epics', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  try {
    // Use the provided JQL for Epics
    const jql = encodeURIComponent('(("Team[Dropdown]" = Applications) OR labels in (Applications, applications)) AND project = "TARANIS PRODUCT" AND status in ("To Do", "Ready For Sprint", "In Progress", QA, Completed, Accepted, Approved, Released) AND issuetype=Epic ORDER BY Rank ASC');
    const url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch epics from Jira' });
    }
    const data = await response.json();
    const epics = (data.issues || []).map(issue => ({
      key: issue.key,
      name: issue.fields.summary,
    }));
    res.json(epics);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching epics from Jira', details: err.message });
  }
});

// Add endpoint to create a Jira issue link
app.post('/api/link-issue', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 