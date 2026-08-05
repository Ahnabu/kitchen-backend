import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Order extends Model {
  declare id: number;
  declare orderRef: string;
  declare userId: number | null;
  declare customerName: string;
  declare customerEmail: string | null;
  declare customerPhone: string;
  declare deliveryAddress: string;
  declare deliveryArea: string | null;
  declare deliveryCity: string;
  declare specialInstructions: string | null;
  declare paymentMethod: 'card' | 'cash' | 'revolut';
  declare paymentStatus: 'pending' | 'paid' | 'failed';
  declare stripePiId: string | null;
  declare subtotal: number;
  declare deliveryFee: number;
  declare total: number;
  declare status: 'confirmed' | 'preparing' | 'quality' | 'delivery' | 'delivered' | 'cancelled';
  declare riderName: string | null;
  declare estimatedMinutes: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderRef: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'order_ref',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_name',
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'customer_email',
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_phone',
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'delivery_address',
    },
    deliveryArea: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'delivery_area',
    },
    deliveryCity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Malta',
      field: 'delivery_city',
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'special_instructions',
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'cash', 'revolut'),
      allowNull: false,
      defaultValue: 'cash',
      field: 'payment_method',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status',
    },
    stripePiId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_pi_id',
    },
    subtotal: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 2.0,
      field: 'delivery_fee',
    },
    total: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'confirmed',
        'preparing',
        'quality',
        'delivery',
        'delivered',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'confirmed',
    },
    riderName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'rider_name',
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 35,
      field: 'estimated_minutes',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    underscored: true,
  }
);

export default Order;
