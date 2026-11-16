const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');
const Purchase = require('./models/Purchase');
const { connectDB } = require('./config/db');

dotenv.config();

// ============================================================================
// DATASET 1 (VERY FIRST REFERENCE): Footwear & Shoes
// Exactly matching the primary UI reference screenshot from prompt 1
// ============================================================================
const shoesSuppliers = [
  {
    name: 'Apex Footwear Distribution',
    email: 'contact@apexfootwear.com',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, OR'
  },
  {
    name: 'Prime Athletic Imports',
    email: 'sales@primeathletic.com',
    phone: '+1 (555) 876-5432',
    address: '1200 Industrial Parkway, Austin, TX'
  },
  {
    name: 'Metro Gear & Equipment',
    email: 'info@metrogear.net',
    phone: '+1 (555) 345-6789',
    address: '45 Commerce Boulevard, Chicago, IL'
  },
  {
    name: 'Pacific Sports Logistics',
    email: 'orders@pacificsports.io',
    phone: '+1 (555) 901-2345',
    address: '88 Harbor View Rd, Seattle, WA'
  }
];

const shoesProducts = [
  { name: 'Nike ZoomX', category: 'Running Shoes', price: 250, quantity: 33 },
  { name: 'Adidas Adizero Pro', category: 'Running Shoes', price: 220, quantity: 30 },
  { name: 'Nike Air Zoom Pegasus 40', category: 'Running Shoes', price: 190, quantity: 18 },
  { name: 'Adidas Barricade Tennis', category: 'Tennis Shoes', price: 180, quantity: 12 },
  { name: 'NikeCourt Air Zoom Vapor', category: 'Tennis Shoes', price: 210, quantity: 8 },
  { name: 'Nike ZOOM VOMERO 5', category: 'Running Shoes', price: 128, quantity: 9 },
  { name: 'NIKE MERCURIAL SUPERFLY 10 ACADEMY TF', category: 'Football Shoes', price: 200, quantity: 15 },
  { name: 'NIKE DUNK LOW RETRO "REDWOOD"', category: 'Lifestyle Sneakers', price: 300, quantity: 14 }
];

// ============================================================================
// DATASET 2: Electronics Catalog
// ============================================================================
const electronicsSuppliers = [
  { name: 'ABC Electronics', email: 'sales@abcelectronics.com', phone: '+1 (555) 012-3456', address: '100 Silicon Way, San Jose, CA' },
  { name: 'TechWorld', email: 'support@techworld.com', phone: '+1 (555) 234-5678', address: '450 Innovation Blvd, Austin, TX' },
  { name: 'Global Traders', email: 'contact@globaltraders.net', phone: '+1 (555) 345-6789', address: '78 Trade Center, New York, NY' },
  { name: 'Digital Hub', email: 'orders@digitalhub.io', phone: '+1 (555) 456-7890', address: '320 Tech Plaza, Seattle, WA' },
  { name: 'Apex Component Supply', email: 'info@apexsupply.com', phone: '+1 (555) 567-8901', address: '55 Industrial Park, Chicago, IL' },
  { name: 'Prime Systems Corp', email: 'sales@primesystems.com', phone: '+1 (555) 678-9012', address: '12 Gateway Center, Boston, MA' },
  { name: 'NextGen Hardware', email: 'orders@nextgenhw.com', phone: '+1 (555) 789-0123', address: '99 Micro Drive, Boulder, CO' },
  { name: 'Omni Distribution', email: 'service@omnidist.com', phone: '+1 (555) 890-1234', address: '14 Logistics Way, Atlanta, GA' }
];

const electronicsProducts = [
  { name: 'Laptop', category: 'Computers', price: 8000, quantity: 24 },
  { name: 'Mouse', category: 'Accessories', price: 150, quantity: 120 },
  { name: 'Keyboard', category: 'Accessories', price: 300, quantity: 85 },
  { name: 'Monitor', category: 'Displays', price: 3000, quantity: 35 },
  { name: 'Headphones', category: 'Audio', price: 700, quantity: 45 },
  { name: 'External SSD 1TB', category: 'Storage', price: 120, quantity: 60 },
  { name: 'USB-C Docking Station', category: 'Accessories', price: 180, quantity: 40 },
  { name: 'Webcam 4K Ultra HD', category: 'Peripherals', price: 210, quantity: 18 }
];

const seedData = async (type = 'shoes') => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log(`[Seed] Clearing existing collections for mode: ${type}...`);
    await Purchase.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});

    if (type === 'electronics') {
      console.log('[Seed] Populating Electronics Dataset (ABC Electronics, Laptop, Mouse)...');
      const createdSuppliers = await Supplier.insertMany(electronicsSuppliers);
      const createdProducts = await Product.insertMany(electronicsProducts);

      const getSupp = (name) => createdSuppliers.find(s => s.name === name);
      const getProd = (name) => createdProducts.find(p => p.name === name);

      const purchasesData = [
        {
          purchaseId: '#P001',
          supplierId: getSupp('ABC Electronics')._id,
          productId: getProd('Laptop')._id,
          quantity: 10,
          unitPrice: 8000,
          totalAmount: 80000,
          status: 'Completed',
          purchaseDate: new Date('2026-11-15')
        },
        {
          purchaseId: '#P002',
          supplierId: getSupp('TechWorld')._id,
          productId: getProd('Mouse')._id,
          quantity: 50,
          unitPrice: 150,
          totalAmount: 7500,
          status: 'Completed',
          purchaseDate: new Date('2026-11-14')
        },
        {
          purchaseId: '#P003',
          supplierId: getSupp('Global Traders')._id,
          productId: getProd('Keyboard')._id,
          quantity: 30,
          unitPrice: 300,
          totalAmount: 9000,
          status: 'Pending',
          purchaseDate: new Date('2026-11-13')
        },
        {
          purchaseId: '#P004',
          supplierId: getSupp('ABC Electronics')._id,
          productId: getProd('Monitor')._id,
          quantity: 15,
          unitPrice: 3000,
          totalAmount: 45000,
          status: 'Completed',
          purchaseDate: new Date('2026-11-12')
        },
        {
          purchaseId: '#P005',
          supplierId: getSupp('Digital Hub')._id,
          productId: getProd('Headphones')._id,
          quantity: 20,
          unitPrice: 700,
          totalAmount: 14000,
          status: 'Pending',
          purchaseDate: new Date('2026-11-10')
        }
      ];

      await Purchase.insertMany(purchasesData);
      console.log('[Seed] Electronics database seeded successfully (#P001 - #P005)!');
      return { success: true, count: purchasesData.length, mode: 'electronics' };
    } else {
      // Default: The VERY FIRST reference database (Footwear & Shoes)
      console.log('[Seed] Populating The VERY FIRST Reference Dataset (Footwear / Shoes)...');
      const createdSuppliers = await Supplier.insertMany(shoesSuppliers);
      const createdProducts = await Product.insertMany(shoesProducts);

      const purchasesData = [
        {
          purchaseId: '#P001',
          supplierId: createdSuppliers[0]._id,
          productId: createdProducts[0]._id, // Nike ZoomX
          quantity: 10,
          unitPrice: 250,
          totalAmount: 2500,
          status: 'Completed',
          purchaseDate: new Date('2026-11-15')
        },
        {
          purchaseId: '#P002',
          supplierId: createdSuppliers[1]._id,
          productId: createdProducts[1]._id, // Adidas Adizero Pro
          quantity: 8,
          unitPrice: 220,
          totalAmount: 1760,
          status: 'Completed',
          purchaseDate: new Date('2026-11-14')
        },
        {
          purchaseId: '#P003',
          supplierId: createdSuppliers[2]._id,
          productId: createdProducts[2]._id, // Nike Air Zoom Pegasus 40
          quantity: 5,
          unitPrice: 190,
          totalAmount: 950,
          status: 'Pending',
          purchaseDate: new Date('2026-11-13')
        },
        {
          purchaseId: '#P004',
          supplierId: createdSuppliers[0]._id,
          productId: createdProducts[3]._id, // Adidas Barricade Tennis
          quantity: 4,
          unitPrice: 180,
          totalAmount: 720,
          status: 'Completed',
          purchaseDate: new Date('2026-11-12')
        },
        {
          purchaseId: '#P005',
          supplierId: createdSuppliers[3]._id,
          productId: createdProducts[7]._id, // NIKE DUNK LOW RETRO
          quantity: 2,
          unitPrice: 300,
          totalAmount: 600,
          status: 'Pending',
          purchaseDate: new Date('2026-11-10')
        }
      ];

      await Purchase.insertMany(purchasesData);
      console.log('------------------------------------------------------------');
      console.log('[Seed] The VERY FIRST reference database (Footwear/Shoes) seeded successfully:');
      console.log('       • 4 Suppliers: Apex Footwear Distribution, Prime Athletic Imports, Metro Gear, Pacific Sports');
      console.log('       • 8 Products:  Nike ZoomX ($250), Adidas Adizero Pro ($220), Nike Air Zoom Pegasus 40 ($190),');
      console.log('                      Adidas Barricade ($180), NikeCourt Vapor ($210), Vomero 5 ($128), Mercurial ($200), Dunk Low ($300)');
      console.log('       • 5 Purchases: #P001, #P002, #P003, #P004, #P005');
      console.log('------------------------------------------------------------');
      return { success: true, count: purchasesData.length, mode: 'shoes' };
    }
  } catch (err) {
    console.error(`[Seed] Error seeding database: ${err.message}`);
    throw err;
  }
};

// Auto-run when executed directly (node seed.js or npm run seed)
const run = async () => {
  // Accepts 'shoes' (default / first), or 'electronics'
  const mode = process.argv[2] || 'shoes';

  // 1. If backend server is currently running on port 5000, seed via live API to avoid lock conflicts
  try {
    const res = await fetch('http://localhost:5000/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: mode })
    });
    if (res.ok) {
      const result = await res.json();
      console.log(`[Seed] Successfully seeded via running backend server (${mode} mode)`);
      process.exit(0);
      return;
    }
  } catch (err) {
    // Server not running on 5000, connect directly
  }

  // 2. Direct database connection
  try {
    await seedData(mode);
    const { disconnectDB } = require('./config/db');
    await disconnectDB();
    console.log('[Seed] Database disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed] Error in direct seed: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = { seedData };
