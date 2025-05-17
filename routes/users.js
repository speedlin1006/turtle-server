const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../utils/helpers');
const { logOperation } = require('../utils/logHelper');

function isAdmin(req) {
  const token = req.headers['authorization']?.split(' ')[1];
  const userInfo = global.activeTokens[token];
  return userInfo?.username === 'pt001';
}

// ✅ 查詢帳號
router.get('/', verifyToken, async (req, res) => {
  const users = await User.find({ role: 'staff' });
  res.json(users);
});
router.get('/care-users', verifyToken, async (req, res) => {
  const users = await User.find({ role: 'care' });
  res.json(users);
});
router.get('/client-users', verifyToken, async (req, res) => {
  const users = await User.find({ role: 'client' });
  res.json(users);
});

// ✅ 新增帳號
async function createUser(req, res, role, typeName) {
  if (!isAdmin(req)) return res.status(403).json({ success: false });

  const { username, password, name } = req.body;
  const exists = await User.findOne({ username, role });
  if (exists) return res.status(409).json({ success: false });

  const newUser = new User({ username, password, name, role });
  await newUser.save();

  await logOperation({
    type: `新增${typeName}帳號`,
    user: req.user?.username || 'pt001',
    details: {
      newData: req.body
    }
  });

  res.status(201).json({ success: true });
}

router.post('/', (req, res) => createUser(req, res, 'staff', '員工'));
router.post('/care-users', (req, res) => createUser(req, res, 'care', '寄養'));
router.post('/client-users', (req, res) => createUser(req, res, 'client', '售後'));

// ✅ 修改帳號
async function updateUser(req, res, role, typeName) {
  if (!isAdmin(req)) return res.status(403).json({ success: false });

  const { originalUsername, username, password, name } = req.body;
  const oldData = await User.findOne({ username: originalUsername, role });
  if (!oldData) return res.status(404).json({ success: false });

  const updated = await User.findOneAndUpdate(
    { username: originalUsername, role },
    { username, password, name },
    { new: true }
  );

  const changes = {};
  for (const key of ['username', 'password', 'name']) {
    if (oldData[key] !== updated[key]) {
      changes[key] = {
        from: oldData[key],
        to: updated[key]
      };
    }
  }

  await logOperation({
    type: `修改${typeName}帳號`,
    user: req.user?.username || 'pt001',
    details: {
      originalUsername,
      oldData,
      newData: updated,
      changes
    }
  });

  res.json({ success: true });
}

router.put('/', (req, res) => updateUser(req, res, 'staff', '員工'));
router.put('/care-users', (req, res) => updateUser(req, res, 'care', '寄養'));
router.put('/client-users', (req, res) => updateUser(req, res, 'client', '售後'));

// ✅ 刪除帳號
async function deleteUser(req, res, role, typeName) {
  if (!isAdmin(req)) return res.status(403).json({ success: false });

  const { username } = req.body;
  const target = await User.findOne({ username, role });
  if (target) {
    await User.deleteOne({ username, role });

    await logOperation({
      type: `刪除${typeName}帳號`,
      user: req.user?.username || 'pt001',
      details: {
        oldData: target
      }
    });
  }

  res.json({ success: true });
}

router.delete('/', (req, res) => deleteUser(req, res, 'staff', '員工'));
router.delete('/care-users', (req, res) => deleteUser(req, res, 'care', '寄養'));
router.delete('/client-users', (req, res) => deleteUser(req, res, 'client', '售後'));

module.exports = router;
