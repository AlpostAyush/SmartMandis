import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DynamicPricingDashboard.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const DynamicPricingDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [demandScore, setDemandScore] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [daysLeft, setDaysLeft] = useState(7);
  const [forecastResults, setForecastResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optimizationSummary, setOptimizationSummary] = useState(null);
  const [analyticsData,setAnalyticsData]= useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRecommendations: 0,
    averagePriceChange: 0,
    averageConfidence: 0,
    uniqueProducts: 0
  });

  // Fetch overview data on component mount
  useEffect(() => {

  const fetchOverviewData = async () => {
    try {
      const overviewResponse = await axios.get('/api/dashboard/overview');
      if (overviewResponse.data.success && overviewResponse.data.data) {
        const data = overviewResponse.data.data;
        setDashboardStats({
          totalRecommendations: data.dynamic_pricing.total_recommendations || 0,
          averagePriceChange: data.dynamic_pricing.avg_price_change || 0,
          averageConfidence: data.dynamic_pricing.avg_confidence || 0,
          uniqueProducts: data.dynamic_pricing.unique_products || 0
        });
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to fetch overview data');
    }
     try {
          // 1. Fetch products
          const productsResponse = await axios.get('/api/products');
          console.log('Products response:', productsResponse.data);

          if (productsResponse.data.success && productsResponse.data.data) {
            setProducts(productsResponse.data.data);
            console.log('Products loaded:', productsResponse.data.data.length);
          }

          // 2. Fetch categories
          const categoriesResponse = await axios.get('/api/products/meta/categories');
          if (categoriesResponse.data.success && Array.isArray(categoriesResponse.data.data)) {
            setCategories(categoriesResponse.data.data);
            console.log('Categories:', categoriesResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch data from backend:', error);
        }

  };
  

 const fetchAnalyticsData = async () => {
      try {
        const response = await axios.get('/api/pricing/analytics');
        const result = response.data;

        if (Array.isArray(result.data)) {
          // Optional: Rename _id to category for chart readability
          const transformed = result.data.map(item => ({
            ...item,
            category: item._id
          }));

          setAnalyticsData(transformed);
        } else {
          console.warn('Analytics API response does not contain array in `data`');
          setAnalyticsData([]);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to fetch analytics data');
        setAnalyticsData([]);
      }
  };


  const fetchOptimizationSummary = async () => {
  try {
    const res = await fetch("/api/pricing/optimization-summary");
    const json = await res.json();
    if (json.success) {
      setOptimizationSummary(json.data);
    }
  } catch (err) {
    console.error("Failed to fetch optimization summary", err);
  }
};

    fetchOverviewData();
    fetchAnalyticsData();
    fetchOptimizationSummary();
   }, []);

  const handleGenerateForecast = async () => {
    if (!selectedProduct || !demandScore || !currentStock || !daysLeft || !currentPrice) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const selectedProductData = products.find(p => p.product_id === selectedProduct);
      
      if (!selectedProductData) {
        setError('Selected product not found');
        setLoading(false);
        return;
      }
      
      const requestBody = {
        products: [{
          product_id: selectedProductData.product_id,
          product_name: selectedProductData.product_name,
          category: selectedProductData.category || 'Unknown',
          current_price: parseFloat(currentPrice),
          stock_level: parseInt(currentStock),
          days_left: parseInt(daysLeft),
          demand_score: parseFloat(demandScore)
        }]
      };
      
      console.log('Sending forecast request:', requestBody);
      
      const response = await axios.post('/api/pricing/recommend', requestBody);
      
      console.log('Forecast response:', response.data);
      setForecastResults(response.data.data);

      // Update dashboard stats
      setDashboardStats({
      totalRecommendations: response.data.data.total_recommendations || 1,
      averagePriceChange: response.data.data.avg_price_change || 63.35,
      averageConfidence: Math.round((response.data.data.avg_confidence || 0.8) * 100),
      uniqueProducts: response.data.data.unique_products || 1
    });
      
    } catch (error) {
      console.error('Error generating forecast:', error);
      setError(`Failed to generate forecast: ${error.response?.data?.message || error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dynamic Pricing Dashboard</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Recommendations</h3>
          <p className="stat-value">{dashboardStats.totalRecommendations}</p>
        </div>
        <div className="stat-card">
          <h3>Average Price Change</h3>
          <p className="stat-value">{dashboardStats.averagePriceChange.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Average Confidence</h3>
          <p className="stat-value">{dashboardStats.averageConfidence.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Unique Products</h3>
          <p className="stat-value">{dashboardStats.uniqueProducts}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Analytics Chart */}
        <div className="chart-section">
          <h2>Price Analytics</h2>
          <div className="chart-container">
         <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avg_current_price" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Avg Current Price"
              />
              <Line 
                type="monotone" 
                dataKey="avg_recommended_price" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Avg Recommended Price"
              />
            </LineChart>
          </ResponsiveContainer>


          </div>
        </div>

      {/* Forecast Card Section - 40% width */}
        <div className="forecast-card-section">
          <div className="generate-forecast-card">
          <h3>Generate new Forecast</h3>
          
          <div className="control-group">
            <label>Select Product</label>
            <select 
              value={selectedProduct} 
              onChange={e => setSelectedProduct(e.target.value)}
              className="control-select"
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
          <label>Select Category</label>
          <select 
            value={selectedCategory} 
            onChange={async (e) => {
              const category = e.target.value;
              setSelectedCategory(category);
              setSelectedProduct(''); // Reset selected product

              if (category === '') {
                // If "All categories..." selected, fetch all products
                try {
                  const res = await axios.get('/api/products');
                  if (res.data.success && Array.isArray(res.data.data)) {
                    setProducts(res.data.data);
                  }
                } catch (err) {
                  console.error('Error fetching all products:', err);
                }
              } else {
                // Fetch products by selected category
                try {
                  const res = await axios.get(`/api/products/category/${category}`);
                  if (res.data.success && Array.isArray(res.data.data)) {
                    setProducts(res.data.data);
                  }
                } catch (err) {
                  console.error('Error fetching category products:', err);
                }
              }
            }}
            className="control-select"
          >
            <option value="">All categories...</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

          
         <div className="control-group">
        <label>Current Stock</label>
        <input
          type="text"
          value={currentStock}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) setCurrentStock(val); // allow only digits
          }}
          placeholder="Enter current stock"
          className="control-input"
        />
      </div>

      <div className="control-group">
        <label>Days Left</label>
        <input
          type="text"
          value={daysLeft}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) setDaysLeft(val); // allow only digits
          }}
          placeholder="Number of days"
          className="control-input"
        />
      </div>
      <div className="control-group">
        <label>Current Price</label>
        <input
          type="text"
          value={currentPrice}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) setCurrentPrice(val); // allow only digits
          }}
          placeholder="Price"
          className="control-input"
        />
      </div>
      <div className="control-group">
        <label>Demand Score</label>
        <input
          type="text"
          value={demandScore}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) setDemandScore(val); // allow only digits
          }}
          placeholder="Number of days"
          className="control-input"
        />
      </div>

          
          <button 
            onClick={handleGenerateForecast}
            disabled={loading}
            className="generate-card-btn"
          >
            {loading ? '⏳ Generating...' : ' Generate'}
          </button>
          
          {error && <div className="error-message" style={{marginTop: '10px', padding: '10px', fontSize: '0.8rem'}}>{error}</div>}
        </div>
        </div>
      </div>  
      {/* Recommendations Results */}
      <div className="results-container"> 
      {forecastResults && forecastResults.recommendations && (
       <div className="recommendation-grid">
        <h3> Recommendation Generated</h3>
            {forecastResults.recommendations && forecastResults.recommendations.map((result, index) => {
              
              return (
                
                <div key={index} className="daily-forecast-card">
                  
                  <div className="forecast-metrics">
                    <div className="metric">
                      <span className="metric-label">Recommended Price</span>
                      <span className="metric-value">{result.recommended_price}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Percentage Change </span>
                      <span className="metric-value">{result.price_change_percentage}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Confidence</span>
                      <span className="metric-value">{Math.round(result.confidence_score * 100)}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Note : </span>
                      <span className="metric-value">{result.recommendation_reason}</span>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
      )}
      {optimizationSummary && (
  <div className="optimization-summary-card">
    <h3>📈 Optimization Summary (Last {optimizationSummary.period_days || 7} Days)</h3>
    <div className="summary-metrics">
      <div>Total Products: {optimizationSummary.total_products}</div>
      <div>Price Increase: {optimizationSummary.products_with_increase}</div>
      <div>Price Decrease: {optimizationSummary.products_with_decrease}</div>
      <div>No Change: {optimizationSummary.products_no_change}</div>
      <div>Avg Price Change: ₹{optimizationSummary.avg_price_change.toFixed(2)}</div>
      <div>Max Increase: ₹{optimizationSummary.max_price_increase}</div>
      <div>Max Decrease: ₹{optimizationSummary.max_price_decrease}</div>
    </div>
  </div>
)}
</div>

        </div>

      );
    };

export default DynamicPricingDashboard;
