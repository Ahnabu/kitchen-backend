import { MenuItem } from './models';
import sequelize from './config/database';

async function check() {
  await sequelize.authenticate();
  const count = await MenuItem.count();
  console.log(`DATABASE CHECK: There are ${count} items in the menu_items table.`);
  
  if (count > 0) {
    const sample = await MenuItem.findOne();
    console.log('Sample item:', JSON.stringify(sample, null, 2));
  }
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Check failed:', err);
    process.exit(1);
  });
