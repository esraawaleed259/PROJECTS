const crypto = require('crypto');

class Block {
  constructor(index, timestamp, transactions, prevHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.prevHash
      )
      .digest('hex');
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
  }

  // ✅ إنشاء بلوك جديد من المعاملات
  createBlockFromTransactions(transactions) {
    const prevBlock = this.getLastBlock(); // ✅ استخدم getLastBlock هنا
    const newBlock = new Block(
      this.chain.length,
      Date.now().toString(),
      transactions,
      prevBlock ? prevBlock.hash : '0'
    );
    return newBlock;
  }

  // ✅ إضافة بلوك إلى السلسلة
  addBlock(block) {
    this.chain.push(block);
  }

  // ✅ حساب رصيد مستخدم معين
  getBalance(publicKey) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.from === publicKey) balance -= tx.amount;
        if (tx.to === publicKey) balance += tx.amount;
      }
    }
    return balance;
  }

  // ✅ الحصول على كل المعاملات
  getTransactionHistory() {
    const history = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        history.push({ ...tx });
      }
    }
    return history;
  }

  // ✅ الحصول على آخر بلوك في السلسلة
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }
}

module.exports = Blockchain;
