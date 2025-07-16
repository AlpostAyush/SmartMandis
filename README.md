# SmartMandi

A modern platform for agricultural produce management and trading.

## Project Overview

SmartMandi is a comprehensive solution designed to connect farmers, buyers, and markets through a digital platform. The application aims to streamline agricultural trading with features like dynamic pricing, demand forecasting, and real-time market information.

## Features

- **Market Monitoring**: Real-time prices and trends of agricultural commodities
- **Dynamic Pricing**: AI-powered pricing suggestions based on market conditions
- **Demand Forecasting**: Predictive analytics for agricultural produce demand
- **Farmer-Buyer Connection**: Direct communication between producers and buyers
- **Inventory Management**: Track and manage agricultural produce

## Tech Stack

### Frontend
- React.js
- Bootstrap/Material UI
- Redux for state management

### Backend
- Node.js
- Express.js
- MongoDB

### Machine Learning Models
- Demand Forecasting models
- Dynamic Pricing algorithms

## Project Structure

- `smartmandi_frontend/`: React-based frontend application
- `smartmandi_backend/`: Node.js backend API
- `Model_for_Demand_Forecasting/`: Machine learning models for demand prediction
- `Model_for_Dynamic_Pricing/`: Algorithms for dynamic price suggestions
- `Dataset_CSV_Files/`: Data sets for training and testing

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Python 3.7+ (for ML models)

### Backend Setup
```bash
cd smartmandi_backend
npm install
# Configure your .env file with MongoDB URI and other settings
npm start
```

### Frontend Setup
```bash
cd smartmandi_frontend
npm install
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
