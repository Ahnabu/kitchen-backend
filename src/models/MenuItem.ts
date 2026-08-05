import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class MenuItem extends Model {
  declare id: string;
  declare name: string;
  declare nameAr: string | null;
  declare description: string;
  declare price: number;
  declare category: 'burgers' | 'pizzas' | 'wraps' | 'sides' | 'smokehouse';
  declare diet: 'veg' | 'non-veg' | 'vegan';
  declare spicy: boolean;
  declare soldOut: boolean;
  declare imageUrl: string;
  declare tags: string[] | null;
  declare rating: number;
  declare popular: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MenuItem.init(
  {
    id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nameAr: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'name_ar',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('burgers', 'pizzas', 'wraps', 'sides', 'smokehouse'),
      allowNull: false,
    },
    diet: {
      type: DataTypes.ENUM('veg', 'non-veg', 'vegan'),
      allowNull: false,
    },
    spicy: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    soldOut: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'sold_out',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_url',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    popular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'menu_items',
    underscored: true,
  }
);

export default MenuItem;
