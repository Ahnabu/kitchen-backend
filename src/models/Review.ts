import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Review extends Model {
  declare id: number;
  declare userId: number | null;
  declare name: string;
  declare avatarUrl: string | null;
  declare rating: number;
  declare dish: string;
  declare text: string;
  declare verified: boolean;
  declare status: 'pending' | 'published' | 'rejected';
  declare date: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable for guest reviews
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    dish: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'published', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    timestamps: true,
    hooks: {
      beforeValidate: (review: Review) => {
        if (!review.date) {
          review.date = new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
      },
    },
  }
);

export default Review;
