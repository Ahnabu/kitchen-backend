import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Address extends Model {
  declare id: number;
  declare userId: number;
  declare label: string;
  declare address: string;
  declare area: string;
  declare city: string;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Address.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. 'Home', 'Work'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Malta',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'addresses',
    timestamps: true,
  }
);

export default Address;
