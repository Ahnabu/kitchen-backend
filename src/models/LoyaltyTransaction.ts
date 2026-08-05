import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class LoyaltyTransaction extends Model {
  declare id: number;
  declare userId: number;
  declare points: number;
  declare type: 'earn' | 'redeem' | 'bonus' | 'manual';
  declare description: string | null;
  declare readonly createdAt: Date;
}

LoyaltyTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('earn', 'redeem', 'bonus', 'manual'),
      allowNull: false,
      defaultValue: 'earn',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'loyalty_transactions',
    underscored: true,
    updatedAt: false, // Only log the creation timestamp
  }
);

export default LoyaltyTransaction;
