import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class OrderItem extends Model {
  declare id: number;
  declare orderId: number;
  declare menuItemId: string;
  declare itemName: string;
  declare itemPrice: number;
  declare quantity: number;
  declare subtotal: number;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
    },
    menuItemId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'menu_item_id',
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'item_name',
    },
    itemPrice: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: 'item_price',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    underscored: true,
    timestamps: false, // timestamps are not needed for line items
  }
);

export default OrderItem;
