const express = require('express');
const fs = require('fs');
const Blockchain = require('./blockchain');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const votingChain = new Blockchain();

let voterRegistry = JSON.parse(fs.readFileSync('./voterRegistry.json', 'utf-8')).voters;

app.post('/vote', (req, res) => {
  const { voterId, candidate } = req.body;

  if (!voterId || !candidate) {
    return res.status(400).json({ error: 'Voter ID and candidate are required.' });
  }

  const voter = voterRegistry.find(v => v.id === voterId);
  if (!voter) {
    return res.status(403).json({ error: 'Invalid voter.' });
  }

  if (votingChain.isVoterAlreadyVoted(voterId)) {
    return res.status(403).json({ error: 'Voter has already voted.' });
  }

  const block = votingChain.addBlock({ voterId, candidate });
  res.json({ message: 'Vote recorded successfully.', block });
});

app.get('/results', (req, res) => {
  res.json(votingChain.getResults());
});

app.listen(port, () => {
  console.log(`🗳️ Voting server running on http://localhost:${port}`);
});