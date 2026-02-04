import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Ping = sequelize.define('Ping', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  message: {
    type: DataTypes.STRING(200),
    defaultValue: 'wants to connect with you!'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['receiverId', 'isRead'] },
    { fields: ['createdAt'] }
  ]
});

// Define associations
Ping.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Ping.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

export default Ping;
