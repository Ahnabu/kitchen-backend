import sequelize from '../config/database';
import { MenuItem, User, LoyaltyTransaction } from '../models';
import { menuItems } from '../../../src/data/menuData';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seeding...');

  // Sync all models (ensures users and menu_items tables exist)
  await sequelize.sync();
  console.log('✅ Database schema synchronized.');

  // Seeding Menu Items
  // Force reset only the menu_items table
  await MenuItem.sync({ force: true });
  console.log('✅ menu_items table reset.');

  // Map and create menu items
  const itemsToCreate = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    nameAr: item.nameAr || null,
    description: item.description,
    price: item.price,
    category: item.category,
    diet: item.diet,
    spicy: item.spicy || false,
    soldOut: item.soldOut || false,
    imageUrl: item.image, // Map 'image' to 'imageUrl'
    tags: item.tags || null,
    rating: item.rating || 0.0,
    popular: item.popular || false,
  }));

  await MenuItem.bulkCreate(itemsToCreate);
  console.log(`🎉 Seeded ${itemsToCreate.length} menu items successfully.`);

  // Seeding Default Admin User
  const adminEmail = 'admin@example.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log('👤 Seeding default admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const admin = await User.create({
      name: 'Admin Chef',
      email: adminEmail,
      phone: '99119100',
      passwordHash,
      role: 'admin',
      loyaltyPoints: 500,
    });
    await LoyaltyTransaction.create({
      userId: admin.id,
      points: 500,
      type: 'bonus',
      description: 'Sign-up Loyalty Bonus',
    });
    console.log(`✅ Default admin created: ${adminEmail} (password: admin123)`);
  }

  // Seeding Default Customer User
  const customerEmail = 'customer@example.com';
  const existingCustomer = await User.findOne({ where: { email: customerEmail } });
  if (!existingCustomer) {
    console.log('👤 Seeding default customer user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('customer123', salt);
    const customer = await User.create({
      name: 'John Doe',
      email: customerEmail,
      phone: '99228200',
      passwordHash,
      role: 'customer',
      loyaltyPoints: 500,
    });
    await LoyaltyTransaction.create({
      userId: customer.id,
      points: 500,
      type: 'bonus',
      description: 'Sign-up Loyalty Bonus',
    });
    console.log(`✅ Default customer created: ${customerEmail} (password: customer123)`);
  }
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
