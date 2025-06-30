const { Product } = require('../models');

class ProductMappingService {
  constructor() {
    this.productCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize or refresh the product cache
   */
  async refreshCache() {
    try {
      const products = await Product.find({ is_active: true }).select('product_id product_name category');
      
      this.productCache.clear();
      
      products.forEach(product => {
        const normalizedName = this.normalizeProductName(product.product_name);
        this.productCache.set(normalizedName, {
          product_id: product.product_id,
          product_name: product.product_name,
          category: product.category
        });
      });
      
      this.lastCacheUpdate = Date.now();
      console.log(`Product cache refreshed with ${products.length} products`);
      
    } catch (error) {
      console.error('Error refreshing product cache:', error);
      // Fallback to predefined products if database is not available
      this.loadFallbackProducts();
    }
  }

  /**
   * Load fallback products when database is not available
   */
  loadFallbackProducts() {
    const fallbackProducts = [
      { product_id: 'P001', product_name: 'Milk', category: 'Dairy' },
      { product_id: 'P002', product_name: 'Bread', category: 'Bakery' },
      { product_id: 'P003', product_name: 'Butter', category: 'Dairy' },
      { product_id: 'P004', product_name: 'Cheese', category: 'Dairy' },
      { product_id: 'P005', product_name: 'Yogurt', category: 'Dairy' },
      { product_id: 'P006', product_name: 'Eggs', category: 'Dairy' },
      { product_id: 'P007', product_name: 'Croissant', category: 'Bakery' },
      { product_id: 'P008', product_name: 'Bagel', category: 'Bakery' },
      { product_id: 'P009', product_name: 'Muffin', category: 'Bakery' },
      { product_id: 'P010', product_name: 'Cookie', category: 'Bakery' },
      { product_id: 'P011', product_name: 'Banana', category: 'Fruit' },
      { product_id: 'P012', product_name: 'Apple', category: 'Fruit' },
      { product_id: 'P013', product_name: 'Orange', category: 'Fruit' },
      { product_id: 'P014', product_name: 'Grape', category: 'Fruit' },
      { product_id: 'P015', product_name: 'Strawberry', category: 'Fruit' },
      { product_id: 'P016', product_name: 'Chicken Breast', category: 'Meat' },
      { product_id: 'P017', product_name: 'Ground Beef', category: 'Meat' },
      { product_id: 'P018', product_name: 'Salmon', category: 'Meat' },
      { product_id: 'P019', product_name: 'Shrimp', category: 'Meat' },
      { product_id: 'P020', product_name: 'Turkey', category: 'Meat' },
      { product_id: 'P021', product_name: 'Orange Juice', category: 'Beverage' },
      { product_id: 'P022', product_name: 'Coffee', category: 'Beverage' },
      { product_id: 'P023', product_name: 'Baked Beans', category: 'Canned' },
      { product_id: 'P024', product_name: 'Tomato Sauce', category: 'Canned' },
      { product_id: 'P025', product_name: 'Dish Soap', category: 'Cleaning' },
      { product_id: 'P026', product_name: 'Laundry Detergent', category: 'Cleaning' },
      { product_id: 'P027', product_name: 'Ice Cream', category: 'Frozen' },
      { product_id: 'P028', product_name: 'Frozen Pizza', category: 'Frozen' },
      { product_id: 'P029', product_name: 'Vitamins', category: 'Health' },
      { product_id: 'P030', product_name: 'Moisturizer', category: 'Health' },
      { product_id: 'P031', product_name: 'Cough Syrup', category: 'Health' },
      { product_id: 'P032', product_name: 'Dog Food', category: 'Pet' },
      { product_id: 'P033', product_name: 'Cat Food', category: 'Pet' },
      { product_id: 'P034', product_name: 'Lettuce', category: 'Produce' },
      { product_id: 'P035', product_name: 'Tomato', category: 'Produce' },
      { product_id: 'P036', product_name: 'Potato Chips', category: 'Snacks' },
      { product_id: 'P037', product_name: 'Chocolate Bar', category: 'Snacks' }
    ];

    this.productCache.clear();
    fallbackProducts.forEach(product => {
      const normalizedName = this.normalizeProductName(product.product_name);
      this.productCache.set(normalizedName, product);
    });
    
    this.lastCacheUpdate = Date.now();
    console.log(`Loaded ${fallbackProducts.length} fallback products`);
  }

  /**
   * Normalize product name for consistent matching
   */
  normalizeProductName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Check if cache needs refresh
   */
  isCacheExpired() {
    return !this.lastCacheUpdate || (Date.now() - this.lastCacheUpdate) > this.cacheExpiry;
  }

  /**
   * Get product details by name
   */
  async getProductByName(productName) {
    // Refresh cache if expired
    if (this.isCacheExpired()) {
      await this.refreshCache();
    }

    const normalizedName = this.normalizeProductName(productName);
    return this.productCache.get(normalizedName);
  }

  /**
   * Search products by partial name match
   */
  async searchProducts(searchTerm, limit = 10) {
    // Refresh cache if expired
    if (this.isCacheExpired()) {
      await this.refreshCache();
    }

    const normalizedSearch = this.normalizeProductName(searchTerm);
    const results = [];

    for (const [name, product] of this.productCache.entries()) {
      if (name.includes(normalizedSearch) || normalizedSearch.includes(name)) {
        results.push(product);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get all products from cache
   */
  async getAllProducts() {
    // Refresh cache if expired
    if (this.isCacheExpired()) {
      await this.refreshCache();
    }

    return Array.from(this.productCache.values());
  }

  /**
   * Map product input to include product_id
   */
  async mapProductInput(productInput) {
    if (productInput.product_id && productInput.product_name) {
      // Both provided, return as is
      return productInput;
    }

    if (productInput.product_id && !productInput.product_name) {
      // Only product_id provided, try to get name from cache
      const products = await this.getAllProducts();
      const product = products.find(p => p.product_id === productInput.product_id);
      if (product) {
        return {
          ...productInput,
          product_name: product.product_name,
          category: product.category
        };
      }
      return productInput;
    }

    if (productInput.product_name && !productInput.product_id) {
      // Only product_name provided, get product_id from cache
      const product = await this.getProductByName(productInput.product_name);
      if (product) {
        return {
          ...productInput,
          product_id: product.product_id,
          product_name: product.product_name,
          category: product.category
        };
      } else {
        // Product not found in cache, generate a new ID
        const newProductId = await this.generateProductId(productInput.product_name);
        return {
          ...productInput,
          product_id: newProductId,
          category: productInput.category || 'Unknown'
        };
      }
    }

    // Neither provided, return with error
    throw new Error('Either product_name or product_id must be provided');
  }

  /**
   * Generate a new product ID
   */
  async generateProductId(productName) {
    try {
      // Try to get the highest existing product ID
      const products = await Product.find({}).select('product_id').sort({ product_id: -1 }).limit(1);
      
      if (products.length > 0) {
        const lastId = products[0].product_id;
        const numericPart = parseInt(lastId.replace(/\D/g, '')) || 0;
        return `P${String(numericPart + 1).padStart(3, '0')}`;
      } else {
        return 'P001';
      }
    } catch (error) {
      // Fallback to timestamp-based ID if database query fails
      const timestamp = Date.now().toString().slice(-6);
      return `P${timestamp}`;
    }
  }

  /**
   * Batch map multiple product inputs
   */
  async mapProductInputs(productInputs) {
    const mappedProducts = [];
    
    for (const productInput of productInputs) {
      try {
        const mappedProduct = await this.mapProductInput(productInput);
        mappedProducts.push(mappedProduct);
      } catch (error) {
        console.error(`Error mapping product input:`, productInput, error.message);
        // Skip invalid products
        continue;
      }
    }
    
    return mappedProducts;
  }

  /**
   * Add or update product in cache
   */
  addToCache(product) {
    const normalizedName = this.normalizeProductName(product.product_name);
    this.productCache.set(normalizedName, {
      product_id: product.product_id,
      product_name: product.product_name,
      category: product.category
    });
  }

  /**
   * Remove product from cache
   */
  removeFromCache(productName) {
    const normalizedName = this.normalizeProductName(productName);
    this.productCache.delete(normalizedName);
  }
}

// Export singleton instance
module.exports = new ProductMappingService();
