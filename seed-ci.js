const mongoose = require('mongoose');
const User = require('./models/Users');
const Shop = require('./models/Shop');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Shop.deleteMany();

    // 1. Create Shop Owner
    const shopOwner = await User.create({
      name: 'Test Shop Owner',
      email: 'muhaha@gmail.com',
      password: '123456', // Match .env.test
      role: 'shopowner',
      tel: '0123456789'
    });
    console.log('Shop Owner created');

    // 2. Create Shop
    const shop = await Shop.create({
      _id: '69e09583325ac59ae03654c6', // Match TEST_SHOP_ID
      name: 'Test Shop',
      address: {
        street: '123 Main St',
        district: 'District',
        province: 'Province',
        postalcode: '12345'
      },
      tel: '0987654321',
      owner: shopOwner._id,
      openClose: {
        open: '09:00',
        close: '20:00'
      },
      massageType: [{
        name: 'Thai Massage',
        price: 500,
        description: 'Traditional'
      }]
    });
    console.log('Shop created');

    // 3. Create Customer
    await User.create({
      name: 'Test Customer',
      email: 'johannnnnnnn@ex.com',
      password: 'mypassword',
      role: 'user',
      tel: '0111111111'
    });
    console.log('Customer created');

    // 4. Create Admin
    await User.create({
      name: 'Test Admin',
      email: 'adminkeith@example.com',
      password: 'mypassword',
      role: 'admin',
      tel: '0222222222'
    });
    console.log('Admin created');

    console.log('Seeding complete!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
