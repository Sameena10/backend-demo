const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const VideoWatchLog = sequelize.define('VideoWatchLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },

  // FIXED: use DataTypes, add missing comma
  user_id: {
    type: DataTypes.INTEGER,       // SIGNED to match Users.id
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },  // ← YOU MISSED THIS COMMA earlier!!

  video_title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  video_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  watch_seconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'video_watch_logs',
  timestamps: true,
  createdAt: 'watched_at',
  updatedAt: false
});

VideoWatchLog.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

module.exports = VideoWatchLog;
