const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🍫 Айдана Sweets: http://localhost:${PORT}`);
  console.log(`🛠️  Админ: http://localhost:${PORT}/admin/login.html\n`);
});
