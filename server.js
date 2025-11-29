require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sequelize = require('./db');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

// DATABASE CONNECT
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); 
    console.log('Database connected & synced');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

// CREATE USER
app.post('/api/create-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Missing username or password' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const user = await User.create({
      username,
      password: hashedPassword,
      expiry_date: expiryDate,
    });

    res.json({
      message: 'User created successfully',
      id: user.id,
      username: user.username,
      expiresAt: user.expiry_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (new Date() > user.expiry_date)
      return res.status(403).json({ message: 'Account expired' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      id: user.id,
      expiresAt: user.expiry_date
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// RENEW EXPIRY DATE (PUT) USING ID
app.put('/api/renew-expiry/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // ensure ID is a number
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid user ID' });

    // Use findOne instead of findByPk
    const user = await User.findOne({ where: { id } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add 3 days from current expiry date if exists, otherwise from today
    const currentExpiry = user.expiry_date ? new Date(user.expiry_date) : new Date();
    const newExpiryDate = new Date(currentExpiry.getTime() + 3 * 24 * 60 * 60 * 1000);

    user.expiry_date = newExpiryDate;
    await user.save();

    res.json({
      message: 'Expiry date renewed for 3 more days',
      id: user.id,
      newExpiryDate: newExpiryDate.toISOString()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to renew expiry date' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
