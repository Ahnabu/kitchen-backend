import sequelize from '../config/database';
import User from './User';
import LoyaltyTransaction from './LoyaltyTransaction';
import MenuItem from './MenuItem';
import Order from './Order';
import OrderItem from './OrderItem';
import Reservation from './Reservation';
import Address from './Address';
import Review from './Review';
import ContactMessage from './ContactMessage';
import NewsletterSubscriber from './NewsletterSubscriber';
import GalleryImage from './GalleryImage';
import Inventory from './Inventory';
import Staff from './Staff';

// User <-> LoyaltyTransaction
User.hasMany(LoyaltyTransaction, {
  foreignKey: 'userId',
  as: 'loyaltyTransactions',
});
LoyaltyTransaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Order (Nullable for guest orders)
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Reservation (Nullable for guest bookings)
User.hasMany(Reservation, {
  foreignKey: 'userId',
  as: 'reservations',
});
Reservation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Address
User.hasMany(Address, {
  foreignKey: 'userId',
  as: 'addresses',
});
Address.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Review (Nullable for guest reviews)
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
});
Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Staff
User.hasOne(Staff, {
  foreignKey: 'userId',
  as: 'staffProfile',
});
Staff.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Order <-> OrderItem
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// MenuItem <-> OrderItem
MenuItem.hasMany(OrderItem, {
  foreignKey: 'menuItemId',
  as: 'orderItems',
});
OrderItem.belongsTo(MenuItem, {
  foreignKey: 'menuItemId',
  as: 'menuItem',
});

export {
  sequelize,
  User,
  LoyaltyTransaction,
  MenuItem,
  Order,
  OrderItem,
  Reservation,
  Address,
  Review,
  ContactMessage,
  NewsletterSubscriber,
  GalleryImage,
  Inventory,
  Staff,
};
