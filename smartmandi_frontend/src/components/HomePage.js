import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [inventoryStats, setInventoryStats] = useState(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard/overview');
        if (response.data.success) {
          setInventoryStats(response.data.data.inventory);
        } else {
          console.warn('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching overview data:', error);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-left">
          <div className="home-header">
            <h1 className="home-title">Smart Mandi</h1>
            <p className="home-subtitle">AI Powered Retail Intelligence Platform</p>
          </div>

          <div className="features-section">
            <div className="feature-card">
              <h2 className="feature-title">Demand Forecasting</h2>
              <p className="feature-description">
                Predict future demand with advanced machine learning algorithms. 
                Analyze trends across products, categories and regions to optimize 
                inventory levels and reduce stockouts.
              </p>
              <button 
                className="feature-button demand-button"
                onClick={() => navigate('/DemandForecast.html')}
              >
                Get Started
              </button>
            </div>

            <div className="feature-card">
              <h2 className="feature-title">Dynamic Pricing</h2>
              <p className="feature-description">
                Dynamic Pricing optimizes pricing strategies with AI-driven 
                recommendations factoring in market conditions, demand, 
                competition, patterns, and weather data to maximize profit.
              </p>
              <button 
                className="feature-button pricing-button"
                onClick={() => navigate('/DynamicPricing.html')}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="home-right">
          <div className="tablet-container">
            <div className="tablet-frame">
              <div className="tablet-screen">
                
                <div className="screen-content">
                  <div className="preview-header">
                    <div className="preview-stats">
                      <div className="stat-item">
                        <span className="stat-number">
                          {inventoryStats ? inventoryStats.total_products : '...'}
                        </span>
                        <span className="stat-label">Products</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">
                          {inventoryStats ? inventoryStats.categories : '...'}
                        </span>
                        <span className="stat-label">Categories</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">
                          {inventoryStats ? inventoryStats.total_stock : '...'}
                        </span>
                        <span className="stat-label">Total Stock</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">
                          {inventoryStats ? `${Math.round(inventoryStats.avg_price)}` : '...'}
                        </span>
                        <span className="stat-label">Avg Price (₹)</span>
                      </div>
                    </div>
                  </div>
                  <div className="preview-chart">
                    <div className="chart-placeholder"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default HomePage;
