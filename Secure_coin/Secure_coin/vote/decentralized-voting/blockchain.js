const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
                 .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data))
                 .digest('hex');
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), { votes: [] }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newData) {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      newData,
      this.getLatestBlock().hash
    );
    this.chain.push(newBlock);
    return newBlock;
  }

  isVoterAlreadyVoted(voterId) {
    return this.chain.some(block => block.data.voterId === voterId);
  }

  getResults() {
    const counts = {};
    for (let block of this.chain.slice(1)) {
      const candidate = block.data.candidate;
      counts[candidate] = (counts[candidate] || 0) + 1;
    }
    return counts;
  }
}

module.exports = Blockchain;