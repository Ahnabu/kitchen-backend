import sequelize from '../config/database';
import { Inventory } from '../models';

async function seed() {
  console.log('🌱 Starting inventory database seeding...');

  // Sync Inventory model first
  await Inventory.sync({ force: true });
  console.log('✅ inventory table reset and synchronized.');

  const itemsToCreate = [
    { item: 'Burger Buns', stock: 150.0, minLevel: 50.0, unit: 'pcs' },
    { item: 'Beef Patties', stock: 120.0, minLevel: 40.0, unit: 'pcs' },
    { item: 'Mozzarella Cheese', stock: 15.5, minLevel: 5.0, unit: 'kg' },
    { item: 'Pepperoni Slices', stock: 2.0, minLevel: 5.0, unit: 'kg' }, // Low stock!
    { item: 'Tomato Pizza Sauce', stock: 0.0, minLevel: 10.0, unit: 'L' }, // Critical (Out of stock)!
    { item: 'French Fries', stock: 45.0, minLevel: 15.0, unit: 'kg' },
    { item: 'Tortilla Wraps', stock: 80.0, minLevel: 25.0, unit: 'pcs' },
    { item: 'BBQ Sauce', stock: 8.0, minLevel: 3.0, unit: 'L' },
    { item: 'Truffle Oil', stock: 1.2, minLevel: 2.0, unit: 'L' }, // Low stock!
    { item: 'Fresh Lettuce', stock: 12.0, minLevel: 3.0, unit: 'kg' },
    { item: 'Pickles', stock: 5.0, minLevel: 2.0, unit: 'kg' },
    { item: 'Swiss Cheese Slices', stock: 3.5, minLevel: 2.0, unit: 'kg' },
    { item: 'Rocket Leaves', stock: 0.0, minLevel: 2.0, unit: 'kg' }, // Critical (Out of stock)!
  ];

  await Inventory.bulkCreate(itemsToCreate);
  console.log(`🎉 Seeded ${itemsToCreate.length} inventory items successfully.`);
}

seed()
  .then(() => {
    console.log('🔌 Closing DB connection...');
    return sequelize.close();
  })
  .then(() => {
    console.log('👋 Seeding finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
