import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class NewsletterSubscriber extends Model {
  declare id: number;
  declare email: string;
  declare subscribedAt: Date;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NewsletterSubscriber.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    subscribedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'newsletter_subscribers',
    timestamps: true,
  }
);

export default NewsletterSubscriber;
