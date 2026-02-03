import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: '',
    validate: {
      len: [0, 500]
    }
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  inCall: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  socketId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['googleId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['isAvailable']
    }
  ]
});

export default User;
