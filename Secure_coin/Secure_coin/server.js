const express = require('express');
const path = require('path');
const fs = require('fs');
const Blockchain = require('./blockchain/Blockchain');
const Transaction = require('./blockchain/Transaction');
const { generateKeyPairSync } = require('crypto');
const { Parser } = require('json2csv');

const app = express();
const port = 5000;

// Static users
const USERS = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'];
const users = {};
for (const name of USERS) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  users[name] = { publicKey, privateKey };
}

// Generate .json file for each user
const outputDir = path.join(__dirname, 'users');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
for (const name in users) {
  const userFile = {
    name,
    publicKey: users[name].publicKey
  };
  fs.writeFileSync(path.join(outputDir, `${name}.json`), JSON.stringify(userFile, null, 2));
}
console.log('✅ User JSON files generated in /users folder');

const blockchain = new Blockchain();
let pendingTransactions = [];

// Create genesis block
for (const name of USERS) {
  const tx = new Transaction(null, users[name].publicKey, 100);
  pendingTransactions.push(tx);
}
const genesisBlock = blockchain.createBlockFromTransactions(pendingTransactions);
blockchain.addBlock(genesisBlock);
pendingTransactions = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// API routes
app.get('/api/balances', (req, res) => {
  const balances = {};
  for (const name of Object.keys(users)) {
    balances[name] = blockchain.getBalance(users[name].publicKey);
  }
  res.json(balances);
});

app.post('/api/transaction', (req, res) => {
  const { from, to, amount } = req.body;

  if (!users[from] || !users[to]) {
    return res.status(400).json({ message: 'Invalid user(s)' });
  }

  const senderPublicKey = users[from].publicKey;
  const senderBalance = blockchain.getBalance(senderPublicKey);

  // Check for double spending in pending transactions
  const doubleSpendAttempt = pendingTransactions.some(
    tx => tx.from === senderPublicKey && tx.amount === amount
  );
  if (doubleSpendAttempt) {
    return res.status(400).json({ message: '🚨 Double Spending Attempt Detected!' });
  }

  if (amount > senderBalance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  const tx = new Transaction(senderPublicKey, users[to].publicKey, amount);
  tx.signTransaction(users[from].privateKey);

  if (!tx.verifySignature()) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  pendingTransactions.push(tx);
  res.json({ message: 'Transaction added' });
});

app.post('/api/mine', (req, res) => {
  if (pendingTransactions.length === 0) return res.status(400).json({ message: 'No transactions to mine' });

  const block = blockchain.createBlockFromTransactions(pendingTransactions);
  blockchain.addBlock(block);
  pendingTransactions = [];
  res.json({ message: 'Block mined successfully' });
});

app.post('/api/user-balance', (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: 'Missing publicKey in JSON' });

  try {
    const balance = blockchain.getBalance(publicKey);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate balance' });
  }
});

app.get('/api/blockchain', (req, res) => {
  res.json(blockchain.chain);
});

app.get('/api/current-block', (req, res) => {
  const lastBlock = blockchain.getLastBlock();
  if (!lastBlock) {
    return res.status(404).json({ error: 'No blocks found' });
  }
  res.json({ block: lastBlock });
});

app.get('/api/full-chain', (req, res) => {
  res.json({ chain: blockchain.chain });
});

app.post('/api/connect-peer', (req, res) => {
  const { peer } = req.body;
  if (!peer) return res.status(400).json({ error: 'Peer URL is required' });
  console.log(`🔗 Requested to connect to peer: ${peer}`);
  res.json({ message: `Connected to peer ${peer}` });
});

app.post('/api/save', (req, res) => {
  fs.writeFileSync('blockchain.json', JSON.stringify(blockchain.chain, null, 2));
  res.json({ message: 'Blockchain saved to blockchain.json' });
});

app.post('/api/load', (req, res) => {
  try {
    const data = fs.readFileSync('blockchain.json');
    blockchain.chain = JSON.parse(data);
    res.json({ message: 'Blockchain loaded' });
  } catch {
    res.status(500).json({ error: 'Failed to load blockchain' });
  }
});

app.get('/api/transactions', (req, res) => {
  const transactions = blockchain.chain.flatMap(block => block.transactions);
  res.json(transactions);
});

app.get('/api/balances/csv', (req, res) => {
  const balances = Object.keys(users).map(name => ({
    name,
    balance: blockchain.getBalance(users[name].publicKey)
  }));
  const parser = new Parser();
  const csv = parser.parse(balances);
  res.header('Content-Type', 'text/csv');
  res.attachment('balances.csv');
  res.send(csv);
});

app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
