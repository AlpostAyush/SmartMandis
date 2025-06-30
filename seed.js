const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const uri = 'mongodb://127.0.0.1:27017/smartMandi'; // 127.0.0.1 preferred over localhost

// CSV file path
const csvPath = path.join(__dirname, 'Dataset_CSV_Files/demand_forecasting_data.csv');

const productSet = new Map();

async function seedProducts() {
  // Step 1: Load and parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const key = row.product_id?.trim();
        if (key && !productSet.has(key)) {
          productSet.set(key, {
            product_id: key,
            product_name: row.product?.trim(),
            category: row.category?.trim(),
            is_active: true,
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const products = Array.from(productSet.values());
  console.log(`📦 Found ${products.length} unique products to insert.`);

  try {
    // Step 2: Connect to DB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await mongoose.connection.db.admin().ping();
    console.log('✅ Connected to MongoDB');

    // Step 3: Load Product model AFTER connection
    const Product = require('./smartmandi_backend/models/Product');

    // Step 4: Insert into DB
    const result = await Product.insertMany(products, { ordered: false });
    console.log(`✅ Successfully inserted ${result.length} products.`);
  } catch (err) {
    console.error('❌ Insertion failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedProducts();
