import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare passwordHash: string | null;
  declare role: 'customer' | 'admin';
  declare avatarUrl: string | null;
  declare provider: 'local' | 'google' | 'apple';
  declare providerId: string | null;
  declare loyaltyPoints: number;
  declare loyaltyTier: 'silver' | 'gold' | 'platinum';
  declare newsletterSubscribed: boolean;
  declare emailVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true, // Nullable for social auth users
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    provider: {
      type: DataTypes.ENUM('local', 'google', 'apple'),
      allowNull: false,
      defaultValue: 'local',
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 500, // 500 points on signup
    },
    loyaltyTier: {
      type: DataTypes.ENUM('silver', 'gold', 'platinum'),
      allowNull: false,
      defaultValue: 'silver',
    },
    newsletterSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
  }
);

export default User;
