import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Reservation extends Model {
  declare id: number;
  declare ref: string;
  declare userId: number | null;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare date: string; // stored as YYYY-MM-DD
  declare time: string; // e.g. '7:00 PM'
  declare guests: string; // e.g. '2', '9+'
  declare seating: 'indoor' | 'outdoor' | 'private';
  declare occasion: string;
  declare notes: string | null;
  declare tableRef: string | null;
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ref: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    guests: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    seating: {
      type: DataTypes.ENUM('indoor', 'outdoor', 'private'),
      allowNull: false,
      defaultValue: 'indoor',
    },
    occasion: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'None',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tableRef: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'table_ref',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'reservations',
    underscored: true,
  }
);

export default Reservation;
