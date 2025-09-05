const crypto = require('crypto');

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }

  signTransaction(privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(this.from + this.to + this.amount).end();
    this.signature = sign.sign(privateKey, 'hex');
  }

  verifySignature() {
    if (!this.signature) return false;
    const verify = crypto.createVerify('SHA256');
    verify.update(this.from + this.to + this.amount);
    return verify.verify(this.from, this.signature, 'hex');
  }
}

module.exports = Transaction;
