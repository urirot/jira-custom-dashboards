const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/api/epics', require('./routes/epics'));
app.use('/api/epic', require('./routes/epic'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/link-issue', require('./routes/linkIssue'));
app.use('/api/delete-all-links', require('./routes/deleteAllLinks'));
app.use('/api/epic-summary', require('./routes/epicSummary'));
app.use('/api/sprint-metrics', require('./routes/sprintMetrics'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/sprint-dates', require('./routes/sprintDates'));
app.use('/api/sprint-tickets', require('./routes/sprintTickets'));
app.use('/api/boards', require('./routes/boards'));

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 