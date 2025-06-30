import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DemandForecastingDashboard.css';
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

const DemandForecastingDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [forecastDays, setForecastDays] = useState(7);
  const [forecastResults, setForecastResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalForecast: 0,
    predictedUnits: 0,
    avgConfidence: 0,
    categories: 0
  });

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        console.log('Fetching data from backend...');
        
        // Fetch dashboard overview stats
        try {
          const overviewResponse = await axios.get('/api/dashboard/overview');
          console.log('Dashboard overview response:', overviewResponse.data);
          if (overviewResponse.data.success && overviewResponse.data.data) {
            const data = overviewResponse.data.data;
            setDashboardStats({
              totalForecast: data.demand_forecasting.total_forecasts,
              predictedUnits: data.demand_forecasting.total_predicted_units,
              avgConfidence: Math.round(data.demand_forecasting.avg_confidence * 100),
              categories: data.inventory.categories
            });
          }
        } catch (error) {
          console.error('Failed to fetch dashboard overview:', error);
        }
       // Fetch Products, Categories, and Cities from backend
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

          // 3. Fetch cities
          const citiesResponse = await axios.get('/api/products/meta/cities');
          if (citiesResponse.data.success && Array.isArray(citiesResponse.data.data)) {
            setCities(citiesResponse.data.data);
            console.log('Cities:', citiesResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch data from backend:', error);
        }

        // Fetch demand trends for graph
        try {
           const res = await axios.get('http://localhost:5000/api/demand/analytics');
        const raw = res.data.data;

        // Initialize day-wise structure
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const transformed = daysOfWeek.map(day => ({ day }));

        // Fill category data into corresponding day
        raw.forEach(categoryItem => {
          const category = categoryItem._id;
          const daily = categoryItem.daily_predictions;

          daysOfWeek.forEach((day, idx) => {
            const dayData = daily[day];
            transformed[idx][category] = dayData ? dayData.predicted_units : 0;
          });
        });

        setChartData(transformed);
        } catch (error) {
          console.error('Failed to fetch demand trends:', error);
          setChartData([]);
        }
        
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetaData();
  }, []);



  const handleGenerateForecast = async () => {
    if (!selectedProduct || !selectedCity || !currentStock || !forecastDays) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const selectedProductData = products.find(p => p.product_id === selectedProduct);
      
      const requestBody = {
        products: [{ product_name: selectedProductData?.product_name || selectedProduct }],
        forecast_days: parseInt(forecastDays),
        cities: [selectedCity]
      };
      
      console.log('Sending forecast request:', requestBody);
      
      const response = await axios.post('/api/demand/predict', requestBody);
      
      console.log('Forecast response:', response.data);
      setForecastResults(response.data.data);
      
      // Update dashboard stats
      setDashboardStats({
        totalForecast: response.data.data.total_predictions || 1,
        predictedUnits: response.data.data.predictions?.reduce((sum, p) => sum + p.predicted_units, 0) || 82,
        avgConfidence: Math.round((response.data.data.predictions?.reduce((sum, p) => sum + (p.confidence_score || 0.8), 0) / response.data.data.predictions?.length || 0.78) * 100),
        categories: new Set(response.data.data.predictions?.map(p => p.category)).size || 1
      });
      
    } catch (error) {
      console.error('Error generating forecast:', error);
      setError(`Failed to generate forecast: ${error.response?.data?.message || error.message}`);
    }
    
    setLoading(false);
  };

  const calculateStockRecommendation = (predictedUnits, currentStock) => {
    const difference = predictedUnits - currentStock;
    const percentage = Math.round((difference / currentStock) * 100);
    
    if (difference > 0) {
      return {
        action: 'Buy More',
        percentage: `+${percentage}%`,
        className: 'recommendation-buy'
      };
    } else {
      return {
        action: 'Buy Less',
        percentage: `${percentage}%`,
        className: 'recommendation-sell'
      };
    }
  };
   const colors = {
    Dairy: '#4fc3f7',
    Bakery: '#9c27b0',
    Produce: '#D0BEFA',
    Meat: '#5A40FF',
    Fruit: '#26c6da'
  };

  const allCategories = chartData.length
    ? Object.keys(chartData[0]).filter(key => key !== 'day')
    : [];
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1> Welcome to Demand Forecasting Dashboard!</h1>
        <p>AI driven demand prediction and inventory optimization</p>
      </div>

      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{dashboardStats.totalForecast}</div>
            <div className="stat-label">Total Forecast</div>
            <div className="stat-sublabel">This Week</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{dashboardStats.predictedUnits}</div>
            <div className="stat-label">Predicted Units</div>
            <div className="stat-sublabel">Next 7 days</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{dashboardStats.avgConfidence}</div>
            <div className="stat-label">Avg Confidence</div>
            <div className="stat-sublabel">Model Accuracy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-value">{dashboardStats.categories}</div>
            <div className="stat-label">Categories</div>
            <div className="stat-sublabel">Analyzed</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout - Graph and Forecast Card Side by Side */}
      <div className="main-content-layout">
        {/* Graph Section - 60% width */}
        <div className="graph-section">
          <h2>📈 Demand Trends by Category</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              {allCategories.map(cat => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={colors[cat] || '#8884d8'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
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
            <label>Select City</label>
            <select 
              value={selectedCity} 
              onChange={e => setSelectedCity(e.target.value)}
              className="control-select"
            >
              <option value="">Choose a city...</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
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
        <label>Forecast Days</label>
        <input
          type="text"
          value={forecastDays}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) setForecastDays(val); // allow only digits
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

      {/* Forecast Results */}
      {forecastResults && (
        <div className="forecast-results">
          <h2>📊 Forecast Result</h2>
          <div className="results-summary">
            <p>Generated {forecastResults.total_predictions} forecasts for {selectedCity}</p>
            {(() => {
              const totalPredictedUnits = forecastResults.predictions?.reduce((sum, p) => sum + p.predicted_units, 0) || 0;
              const avgConfidence = forecastResults.predictions?.length > 0 
                ? Math.round((forecastResults.predictions.reduce((sum, p) => sum + p.confidence_score, 0) / forecastResults.predictions.length) * 100)
                : 0;
              const stockDifference = totalPredictedUnits - currentStock;
              const stockDifferencePercentage = currentStock > 0 ? Math.round((stockDifference / currentStock) * 100) : 0;
              
              return (
                <div className="forecast-summary-metrics">
                  <div className="summary-metric">
                    <span className="summary-label">Total Predicted Units ({forecastDays} days)</span>
                    <span className="summary-value">{totalPredictedUnits}</span>
                  </div>
                  <div className="summary-metric">
                    <span className="summary-label">Average Confidence</span>
                    <span className="summary-value">{avgConfidence}%</span>
                  </div>
                  <div className="summary-metric">
                    <span className="summary-label">Stock Difference</span>
                    <span className={`summary-value ${stockDifference >= 0 ? 'positive' : 'negative'}`}>
                      {stockDifference >= 0 ? '+' : ''}{stockDifference} ({stockDifferencePercentage >= 0 ? '+' : ''}{stockDifferencePercentage}%)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="daily-forecast-grid">
            {forecastResults.predictions && forecastResults.predictions.map((result, index) => {
              const recommendation = calculateStockRecommendation(result.predicted_units, Math.round(currentStock / forecastDays));
              
              return (
                <div key={index} className="daily-forecast-card">
                  <div className="forecast-date">
                    <span className="date">{new Date(result.forecast_date).toLocaleDateString()}</span>
                    <span className="day">{result.day_of_week}</span>
                  </div>
                  
                  <div className="forecast-metrics">
                    <div className="metric">
                      <span className="metric-label">Predicted Units</span>
                      <span className="metric-value">{result.predicted_units}</span>
                    </div>
                    
                    <div className="metric">
                      <span className="metric-label">Confidence</span>
                      <span className="metric-value">{Math.round(result.confidence_score * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className={`daily-recommendation ${recommendation.className}`}>
                    <span>{recommendation.action}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forecast Analysis */}
      {forecastResults && forecastResults.predictions?.length > 0 && (
        <div className="forecast-analysis">
          <h2>📈 Forecast Analysis</h2>
          <div className="analysis-grid">
            {(() => {
              // Find the prediction with max and min predicted_units
              const maxPrediction = forecastResults.predictions.reduce((max, p) => p.predicted_units > max.predicted_units ? p : max);
              const minPrediction = forecastResults.predictions.reduce((min, p) => p.predicted_units < min.predicted_units ? p : min);

              // Calculate percentage difference (relative to average or to each other)
              const avgUnits = forecastResults.predictions.reduce((sum, p) => sum + p.predicted_units, 0) / forecastResults.predictions.length;
              const maxDiffPercent = Math.round(((maxPrediction.predicted_units - avgUnits) / avgUnits) * 100);
              const minDiffPercent = Math.round(((minPrediction.predicted_units - avgUnits) / avgUnits) * 100);

              return (
                <>
                  <div className="analysis-card">
                    <h3>Peak Demand</h3>
                    <p className="analysis-value">{maxPrediction.day_of_week} {maxDiffPercent >= 0 ? `+${maxDiffPercent}%` : `${maxDiffPercent}%`}</p>
                    <p className="analysis-detail">Highest predicted demand on {maxPrediction.day_of_week}</p>
                  </div>
                  <div className="analysis-card">
                    <h3>Lowest Demand</h3>
                    <p className="analysis-value">{minPrediction.day_of_week} {minDiffPercent >= 0 ? `+${minDiffPercent}%` : `${minDiffPercent}%`}</p>
                    <p className="analysis-detail">Lowest predicted demand on {minPrediction.day_of_week}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};

export default DemandForecastingDashboard;
