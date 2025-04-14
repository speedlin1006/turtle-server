// turtle-server/index.js

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { users } from './users.js'; // 引入帳號資料

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// 登入 API
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.status(200).json({ success: true, message: '登入成功' });
  } else {
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
