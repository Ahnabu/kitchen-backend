import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class ContactMessage extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare subject: string | null;
  declare message: string;
  declare status: 'new' | 'read' | 'replied';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ContactMessage.init(
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
      validate: {
        isEmail: true,
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('new', 'read', 'replied'),
      allowNull: false,
      defaultValue: 'new',
    },
  },
  {
    sequelize,
    tableName: 'contact_messages',
    timestamps: true,
  }
);

export default ContactMessage;
