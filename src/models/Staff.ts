import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Staff extends Model {
  declare id: number;
  declare name: string;
  declare role: string;
  declare status: 'on-duty' | 'off-duty';
  declare shift: string;
  declare userId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Staff.init(
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
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('on-duty', 'off-duty'),
      allowNull: false,
      defaultValue: 'off-duty',
    },
    shift: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'staff',
    timestamps: true,
  }
);

export default Staff;
