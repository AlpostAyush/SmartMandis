import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import DemandForecastingDashboard from './components/DemandForecastingDashboard';
import DynamicPricingDashboard from './components/DynamicPricingDashboard';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/DemandForecast.html" element={<DemandForecastingDashboard />} />
          <Route path="/DynamicPricing.html" element={<DynamicPricingDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
