require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sequelize = require('./db');
const User = require('./models/User');
const VideoWatchLog = require('./models/Videowatch');

const app = express();
app.use(express.json());
app.use(cors());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

(async () => {
  try {
    await sequelize.sync();
    console.log('Database connected & synced');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

app.post('/api/create-user', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Missing username or password' });

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser)
      return res.status(409).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword
    });

    res.json({
      message: 'User created successfully',
      id: user.id,
      username: user.username
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      id: user.id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/video-watch', authenticateToken, async (req, res) => {
  try {
    const { video_title, video_url, watch_seconds } = req.body;
    const user_id = req.user.id;

    if (!video_title || !video_url || !watch_seconds)
      return res.status(400).json({ message: 'Missing fields' });

    const log = await VideoWatchLog.create({
      user_id,
      video_title,
      video_url,
      watch_seconds
    });

    res.json({
      message: 'Video watch logged',
      log
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to log video watch' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
