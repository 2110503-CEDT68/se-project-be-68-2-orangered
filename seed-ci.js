const mongoose = require('mongoose');
const User = require('./models/Users');
const Shop = require('./models/Shop');
const Reservation = require('./models/Reservation');
const Rating = require('./models/Rating');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Shop.deleteMany();
    await Reservation.deleteMany();
    await Rating.deleteMany();

    // Fixed IDs for consistency
    const shopOwnerId = '69f0fe05bcdbf48350e2f3f7';
    const customerId = '69f0fe05bcdbf48350e2f3f8';
    const adminId = '69f0fe05bcdbf48350e2f3f9';
    const deactivateUserId = '69f0fe05bcdbf48350e2f3fa';

    const shopId = process.env.TEST_SHOP_ID || '69e09583325ac59ae03654c6';
    const ratingShopId = process.env.TEST_RATING_SHOP_ID || '69c18e195177b2a42c8cf139';

    // 1. Create Users
    await User.create([
      {
        _id: shopOwnerId,
        name: 'Test Shop Owner',
        email: process.env.TEST_SHOP_OWNER_EMAIL || 'muhaha@gmail.com',
        password: process.env.TEST_SHOP_OWNER_PASSWORD || '123456',
        role: 'shopowner',
        tel: '0123456789'
      },
      {
        _id: customerId,
        name: 'Test Customer',
        email: process.env.TEST_CUSTOMER_EMAIL || 'johannnnnnnn@ex.com',
        password: process.env.TEST_CUSTOMER_PASSWORD || 'mypassword',
        role: 'user',
        tel: '0111111111'
      },
      {
        _id: adminId,
        name: 'Test Admin',
        email: process.env.TEST_ADMIN_EMAIL || 'adminkeith@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'mypassword',
        role: 'admin',
        tel: '0222222222'
      },
      {
        _id: deactivateUserId,
        name: 'Test Deactivate',
        email: process.env.TEST_DEACTIVATE_EMAIL || 'client_1777004995801@test.com',
        password: process.env.TEST_DEACTIVATE_PASSWORD || 'password123',
        role: 'user',
        tel: '0333333333'
      }
    ]);

    // 2. Create Shops
    await Shop.create([
      {
        _id: shopId,
        name: 'Test Shop Primary',
        address: { street: '123 Main', district: 'D1', province: 'P1', postalcode: '12345' },
        tel: '0987654321',
        owner: shopOwnerId,
        openClose: { open: '09:00', close: '20:00' },
        massageType: [{ name: 'Thai Massage', price: 500 }]
      },
      {
        _id: ratingShopId,
        name: 'Test Shop Rating',
        address: { street: '456 Side', district: 'D2', province: 'P2', postalcode: '67890' },
        tel: '0111222333',
        owner: shopOwnerId,
        openClose: { open: '09:00', close: '20:00' },
        massageType: [{ name: 'Thai Massage', price: 500 }]
      }
    ]);

    // 3. Create a Past Reservation for the Customer at Rating Shop
    // This allows TC1-1 to find a validReservationId and submit a rating
    const reservation = await Reservation.create({
      _id: '69f1054fbcdbf48350e3026f',
      appDate: new Date(Date.now() - 86400000), // yesterday
      user: customerId,
      shop: ratingShopId,
      massageType: 'Thai Massage',
      massagePrice: 500
    });

    // 4. Create an existing rating for TC1-2, TC1-3, TC1-4
    // TC1-2 expects: "The guest preferred to stay silent." which happens when review is empty
    await Rating.create({
      _id: '69f1054fbcdbf48350e3027a',
      user: adminId, // Another user's silent review
      shop: ratingShopId,
      score: 4,
      review: ''
    });

    // TC1-3 and TC1-4 expect the customer to have their own review with "Verified Author"
    await Rating.create({
      _id: '69f1054fbcdbf48350e3027b',
      user: customerId,
      shop: ratingShopId,
      reservation: reservation._id,
      score: 3,
      review: 'Original review'
    });

    console.log('Seeding complete with fixed IDs and required test data!');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
