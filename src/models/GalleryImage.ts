import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class GalleryImage extends Model {
  declare id: number;
  declare src: string;
  declare alt: string;
  declare category: 'Food' | 'Smokehouse' | 'Drinks' | 'Interior' | 'Ambience';
  declare sortOrder: number;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

GalleryImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    src: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    alt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Food', 'Smokehouse', 'Drinks', 'Interior', 'Ambience'),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'gallery_images',
    timestamps: true,
  }
);

export default GalleryImage;
