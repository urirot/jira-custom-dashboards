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

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 