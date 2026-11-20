const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB, disconnectDB } = require('./config/db');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const Purchase = require('./models/Purchase');

async function viewDatabase() {
  console.log('\n===============================================================');
  console.log('              INVENTO DATABASE VIEWER');
  console.log('===============================================================\n');

  try {
    await connectDB();

    const [products, suppliers, purchases] = await Promise.all([
      Product.find().sort({ createdAt: -1 }),
      Supplier.find().sort({ createdAt: -1 }),
      Purchase.find().populate('supplierId productId').sort({ createdAt: -1 })
    ]);

    // 1. Products
    console.log(`\n📦 PRODUCTS COLLECTION (${products.length} records):`);
    if (products.length === 0) {
      console.log('   (No products found)');
    } else {
      console.table(
        products.map((p, idx) => ({
          '#': idx + 1,
          'ID': p._id.toString().slice(-6),
          'Product Name': p.name,
          'Category': p.category,
          'Price ($)': `$${p.price.toFixed(2)}`,
          'Quantity': p.quantity
        }))
      );
    }

    // 2. Suppliers
    console.log(`\n🏢 SUPPLIERS COLLECTION (${suppliers.length} records):`);
    if (suppliers.length === 0) {
      console.log('   (No suppliers found)');
    } else {
      console.table(
        suppliers.map((s, idx) => ({
          '#': idx + 1,
          'ID': s._id.toString().slice(-6),
          'Name': s.name,
          'Email': s.email,
          'Phone': s.phone,
          'Address': s.address
        }))
      );
    }

    // 3. Purchases
    console.log(`\n🛒 PURCHASES COLLECTION (${purchases.length} records):`);
    if (purchases.length === 0) {
      console.log('   (No purchases found)');
    } else {
      console.table(
        purchases.map((pur, idx) => ({
          '#': idx + 1,
          'Purchase ID': pur.purchaseId || pur._id.toString().slice(-6),
          'Supplier': pur.supplierId?.name || 'N/A',
          'Product': pur.productId?.name || 'N/A',
          'Qty': pur.quantity,
          'Unit Price': `$${pur.unitPrice !== undefined ? Number(pur.unitPrice).toFixed(2) : '0.00'}`,
          'Total Amount': `$${pur.totalAmount !== undefined ? Number(pur.totalAmount).toFixed(2) : '0.00'}`,
          'Date': pur.purchaseDate ? new Date(pur.purchaseDate).toISOString().split('T')[0] : 'N/A'
        }))
      );
    }

    // Summary
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const totalExpenditure = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

    console.log('\n---------------------------------------------------------------');
    console.log('📊 DATABASE SUMMARY:');
    console.log(`   • Total Products:        ${products.length}`);
    console.log(`   • Total Suppliers:       ${suppliers.length}`);
    console.log(`   • Total Purchases:       ${purchases.length}`);
    console.log(`   • Total Inventory Value: $${totalInventoryValue.toLocaleString()}`);
    console.log(`   • Total Expenditure:     $${totalExpenditure.toLocaleString()}`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('Error reading database:', err.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

viewDatabase();
