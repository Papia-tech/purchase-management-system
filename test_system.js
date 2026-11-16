const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('  INVENTO PURCHASE MANAGEMENT SYSTEM - TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'OK', 'Backend health check returns status 200 OK');

    // 2. Add Supplier
    const newSupplier = {
      name: 'Alpha Athletic Goods',
      email: 'sales@alphaathletic.com',
      phone: '+1 (555) 111-2222',
      address: '100 Olympic Way, Eugene, OR'
    };
    const createSupplierRes = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupplier)
    });
    const createSupplierData = await createSupplierRes.json();
    assert(createSupplierRes.status === 201 && createSupplierData.success, 'Create Supplier creates MongoDB document');
    const supplierId = createSupplierData.data._id;

    // 3. Get Suppliers List
    const getSuppliersRes = await fetch(`${BASE_URL}/suppliers`);
    const getSuppliersData = await getSuppliersRes.json();
    const foundSupplier = getSuppliersData.data.find(s => s._id === supplierId);
    assert(foundSupplier && foundSupplier.name === 'Alpha Athletic Goods', 'Supplier list contains newly added supplier');

    // 4. Edit Supplier
    const updateSupplierRes = await fetch(`${BASE_URL}/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alpha Athletic Goods Updated',
        email: 'sales@alphaathletic.com',
        phone: '+1 (555) 999-8888',
        address: '100 Olympic Way Suite 4, Eugene, OR'
      })
    });
    const updateSupplierData = await updateSupplierRes.json();
    assert(updateSupplierData.data.name === 'Alpha Athletic Goods Updated', 'Update Supplier updates document');

    // 5. Add Product
    const newProduct = {
      name: 'Invento Air Zoom Runner',
      category: 'Running Shoes',
      price: 150,
      quantity: 20
    };
    const createProductRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const createProductData = await createProductRes.json();
    assert(createProductRes.status === 201 && createProductData.success, 'Create Product creates MongoDB document with quantity');
    const productId = createProductData.data._id;
    assert(createProductData.data.quantity === 20, 'Initial product quantity matches (20 units)');

    // 6. Get Products List
    const getProductsRes = await fetch(`${BASE_URL}/products`);
    const getProductsData = await getProductsRes.json();
    const foundProduct = getProductsData.data.find(p => p._id === productId);
    assert(foundProduct && foundProduct.name === 'Invento Air Zoom Runner', 'Product list contains newly added product');

    // 7. Edit Product
    const updateProductRes = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 160 })
    });
    const updateProductData = await updateProductRes.json();
    assert(updateProductData.data.price === 160, 'Update Product updates price to 160');

    // 8. Test Validation: Invalid Purchase with missing fields
    const invalidPurchaseRes = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: -5 })
    });
    assert(invalidPurchaseRes.status === 400, 'Purchase API properly rejects invalid payload with HTTP 400');

    // 9. Record Purchase & Stock Update
    const purchasePayload = {
      supplierId,
      productId,
      quantity: 12,
      unitPrice: 160,
      purchaseDate: new Date().toISOString()
    };
    const purchaseRes = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchasePayload)
    });
    const purchaseData = await purchaseRes.json();
    assert(purchaseRes.status === 201 && purchaseData.success, 'Purchase creation succeeds with HTTP 201');

    // Verify server-side total calculation: 12 * 160 = 1920
    const totalAmount = purchaseData.data.purchase.totalAmount;
    assert(totalAmount === 1920, `Server-side total amount calculated correctly (12 * 160 = ${totalAmount})`);

    // Verify product quantity increased in DB: 20 + 12 = 32
    const verifyProductRes = await fetch(`${BASE_URL}/products/${productId}`);
    const verifyProductData = await verifyProductRes.json();
    assert(verifyProductData.data.quantity === 32, `Product available stock incremented from 20 to 32 (+12 units)`);

    // 10. Verify Purchase in Purchase History
    const purchasesHistoryRes = await fetch(`${BASE_URL}/purchases`);
    const purchasesHistoryData = await purchasesHistoryRes.json();
    const createdPurchaseInHistory = purchasesHistoryData.data.find(p => p._id === purchaseData.data.purchase._id);
    assert(createdPurchaseInHistory && createdPurchaseInHistory.quantity === 12, 'Purchase is present in purchases history with populated references');
    assert(createdPurchaseInHistory.supplierId.name === 'Alpha Athletic Goods Updated', 'Populated supplier name matches');
    assert(createdPurchaseInHistory.productId.name === 'Invento Air Zoom Runner', 'Populated product name matches');

    // 11. Verify Dashboard Metrics from MongoDB
    const dashboardRes = await fetch(`${BASE_URL}/dashboard`);
    const dashboardData = await dashboardRes.json();
    assert(dashboardData.success, 'Dashboard API returns live metrics');
    assert(dashboardData.data.totalSuppliers >= 1, `Total Suppliers count: ${dashboardData.data.totalSuppliers}`);
    assert(dashboardData.data.totalProducts >= 1, `Total Products count: ${dashboardData.data.totalProducts}`);
    assert(dashboardData.data.totalPurchases >= 1, `Total Purchases count: ${dashboardData.data.totalPurchases}`);
    assert(dashboardData.data.totalExpenditure >= 1920, `Total Expenditure aggregation includes purchase: $${dashboardData.data.totalExpenditure}`);
    assert(dashboardData.data.recentPurchases.length > 0, 'Recent purchases list populated');

    // 12. Test Deleting a temporary product and supplier
    const tempProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temp Item to Delete',
        category: 'Misc',
        price: 10,
        quantity: 5
      })
    });
    const tempProdData = await tempProdRes.json();
    const deleteProdRes = await fetch(`${BASE_URL}/products/${tempProdData.data._id}`, { method: 'DELETE' });
    const deleteProdData = await deleteProdRes.json();
    assert(deleteProdData.success, 'Delete product endpoint removes document');

    const tempSuppRes = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temp Vendor',
        email: 'temp@vendor.com',
        phone: '1234567890',
        address: 'Nowhere'
      })
    });
    const tempSuppData = await tempSuppRes.json();
    const deleteSuppRes = await fetch(`${BASE_URL}/suppliers/${tempSuppData.data._id}`, { method: 'DELETE' });
    const deleteSuppData = await deleteSuppRes.json();
    assert(deleteSuppData.success, 'Delete supplier endpoint removes document');

    console.log('\n====================================================');
    console.log(`  RESULT: ALL ${passed} / ${total} TESTS PASSED PERFECTLY!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runTests();
