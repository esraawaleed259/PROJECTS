<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blockchain Wallet</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: auto;
      padding: 20px;
    }
    h1, h2 {
      color: #2c3e50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
    }
    input, select, button {
      margin: 5px 0;
      padding: 8px;
      width: 100%;
    }
    .success {
      color: green;
    }
    .error {
      color: red;
    }
    .section {
      background-color: #f8f8f8;
      padding: 10px;
      margin-top: 20px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <h1>Blockchain Wallet</h1>

  <div class="section">
    <h2>Step 1: Upload User JSON</h2>
    <input type="file" id="userFile">
    <button onclick="loadUser()">Load User</button>
    <p id="userStatus"></p>
  </div>

  <div class="section">
    <h2>Step 2: View Balance</h2>
    <button onclick="viewUserBalance()">View Balance</button>
    <p id="userBalanceResult"></p>
  </div>

  <div class="section">
    <h2>Step 3: Send Transaction</h2>
    <form id="tx-form">
      <label for="to">Send To:</label>
      <select id="to" required></select>

      <label for="amount">Amount:</label>
      <input type="number" id="amount" min="1" required>

      <button type="submit">Send</button>
    </form>
    <div id="tx-status"></div>
  </div>

  <div class="section">
    <h2>Step 4: Mine Block</h2>
    <button id="mine-btn">Mine Pending Transactions</button>
    <div id="mine-status"></div>
  </div>

  <div class="section">
    <h2>Step 5: All User Balances</h2>
    <button onclick="fetchBalances()">Refresh All Balances</button>
    <table id="balances-table">
      <thead>
        <tr><th>User</th><th>Balance</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <script>
    let loadedUser = null;

    async function loadUser() {
      const fileInput = document.getElementById('userFile');
      const status = document.getElementById('userStatus');
      status.textContent = '';

      if (fileInput.files.length === 0) {
        alert('Please upload a JSON file first.');
        return;
      }

      const file = fileInput.files[0];
      const text = await file.text();
      try {
        loadedUser = JSON.parse(text);
        status.textContent = `✅ Loaded user: ${loadedUser.name}`;
        status.className = 'success';
      } catch (err) {
        status.textContent = '❌ Invalid JSON file';
        status.className = 'error';
      }
    }

    async function viewUserBalance() {
      if (!loadedUser) {
        alert('Please load a user first.');
        return;
      }

      const result = document.getElementById('userBalanceResult');
      result.textContent = '';

      const res = await fetch('/api/user-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loadedUser)
      });

      const data = await res.json();
      if (data.error) {
        result.textContent = '❌ ' + data.error;
        result.className = 'error';
      } else {
        result.textContent = `✅ Balance: ${data.balance}`;
        result.className = 'success';
      }
    }

    async function fetchBalances() {
      const res = await fetch('/api/balances');
      const data = await res.json();
      const table = document.querySelector('#balances-table tbody');
      const toSelect = document.querySelector('#to');
      table.innerHTML = '';
      toSelect.innerHTML = '';
      for (const user in data) {
        table.innerHTML += `<tr><td>${user}</td><td>${data[user]}</td></tr>`;
        toSelect.innerHTML += `<option value="${user}">${user}</option>`;
      }
    }

    document.getElementById('tx-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!loadedUser) {
        alert('Please load a user first.');
        return;
      }

      const to = document.getElementById('to').value;
      const amount = parseInt(document.getElementById('amount').value);
      const status = document.getElementById('tx-status');

      if (loadedUser.name === to) {
        status.textContent = '❌ Cannot send to the same user.';
        status.className = 'error';
        return;
      }

      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: loadedUser.name,
          publicKey: loadedUser.publicKey,
          to,
          amount
        })
      });

      const result = await res.json();
      status.textContent = result.message;
      status.className = res.ok ? 'success' : 'error';
      fetchBalances();
    });

    document.getElementById('mine-btn').addEventListener('click', async () => {
      const status = document.getElementById('mine-status');
      const res = await fetch('/api/mine', { method: 'POST' });
      const result = await res.json();
      status.textContent = result.message;
      status.className = res.ok ? 'success' : 'error';
      fetchBalances();
    });

    fetchBalances();
  </script>
</body>
</html>