const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/:id', async (req, res) => {
  const { JIRA_API_TOKEN, JIRA_DOMAIN, JIRA_EMAIL } = process.env;
  const epicKey = req.params.id;
  const project = req.query.project || 'TARANIS PRODUCT';
  if (!JIRA_API_TOKEN || !JIRA_DOMAIN || !JIRA_EMAIL) {
    return res.status(500).json({ error: 'Jira credentials not set in .env' });
  }
  try {
    // JQL for all issues in the Epic, no team filter
    const jql = encodeURIComponent(`project = "${project}" AND status in ("To Do", "Ready For Sprint", "In Progress", QA, Completed, Accepted, Approved, Released) AND \"Epic Link\" = ${epicKey} ORDER BY Rank ASC`);
    const url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary,issuetype,status,issuelinks,assignee,customfield_10014,customfield_10465`;
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

    // JQL for all issues in open sprints (customized, no team filter)
    const openSprintJql = encodeURIComponent(`project = "${project}" AND status not in (Product, UX) AND Sprint in openSprints() ORDER BY cf[10005] DESC, assignee ASC`);
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
        team: issue.fields.customfield_10465 || null,
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

module.exports = router; 