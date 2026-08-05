import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Inventory extends Model {
  declare id: number;
  declare item: string;
  declare stock: number;
  declare minLevel: number;
  declare unit: string;
  declare status: 'ok' | 'low' | 'critical';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

const computeStatus = (stock: number, minLevel: number): 'ok' | 'low' | 'critical' => {
  if (stock <= 0) return 'critical';
  if (stock < minLevel) return 'low';
  return 'ok';
};

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    item: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        return parseFloat(this.getDataValue('stock'));
      },
    },
    minLevel: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        return parseFloat(this.getDataValue('minLevel'));
      },
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pcs',
    },
    status: {
      type: DataTypes.ENUM('ok', 'low', 'critical'),
      allowNull: false,
      defaultValue: 'ok',
    },
  },
  {
    sequelize,
    tableName: 'inventory',
    timestamps: true,
    hooks: {
      beforeSave: (inventory: Inventory) => {
        inventory.status = computeStatus(inventory.stock, inventory.minLevel);
      },
      beforeValidate: (inventory: Inventory) => {
        inventory.status = computeStatus(inventory.stock, inventory.minLevel);
      },
    },
  }
);

export default Inventory;
