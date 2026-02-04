import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Friendship = sequelize.define('Friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  addresseeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['requesterId', 'addresseeId'], unique: true },
    { fields: ['status'] }
  ]
});

// Define associations
Friendship.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });
Friendship.belongsTo(User, { as: 'addressee', foreignKey: 'addresseeId' });

export default Friendship;
