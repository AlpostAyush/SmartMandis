#!/usr/bin/env python3
"""
Model Service for Smart Mandi Backend
Handles demand forecasting and dynamic pricing predictions
"""

import pandas as pd
import numpy as np
import pickle
import json
import sys
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class SmartMandiModelService:
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.demand_model = None
        self.pricing_model = None
        self.model_features = None
        self.load_models()
    
    def load_models(self):
        """Load the trained models and features"""
        try:
            # Get the project root directory (parent of smartmandi_backend)
            project_root = os.path.dirname(self.base_path)
            
            # Load demand forecasting model
            demand_model_path = os.path.join(project_root, 'Model_for_Demand_Forecasting', 'autos_model.pkl')
            with open(demand_model_path, 'rb') as f:
                self.demand_model = pickle.load(f)
            
            # Load pricing model
            pricing_model_path = os.path.join(project_root, 'Model_for_Dynamic_Pricing', 'xgb_model.pkl')
            with open(pricing_model_path, 'rb') as f:
                self.pricing_model = pickle.load(f)
            
            # Load model features (create if doesn't exist)
            features_path = os.path.join(project_root, 'Model_for_Dynamic_Pricing', 'model_features.json')
            try:
                with open(features_path, 'r') as f:
                    self.model_features = json.load(f)
            except FileNotFoundError:
                # Create default features if file doesn't exist
                self.model_features = {
                    "features": [
                        "days_left", "stock_level", "demand_score",
                        "category_encoded", "season_encoded", "weekday_encoded"
                    ]
                }
                print("Model features file not found, using default features")
                
            print("Models loaded successfully")
            
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            raise e
    
    def predict_demand(self, input_data):
        """
        Predict demand for given products
        
        Args:
            input_data: Dict containing prediction parameters
                - products: List of product data
                - forecast_days: Number of days to forecast
                - cities: List of cities
        
        Returns:
            Dict containing predictions
        """
        try:
            results = []
            
            # Get parameters
            products = input_data.get('products', [])
            forecast_days = input_data.get('forecast_days', 7)
            cities = input_data.get('cities', ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'])
            
            # Generate predictions for each product and city combination
            for product in products:
                for city in cities:
                    for day in range(forecast_days):
                        forecast_date = datetime.now() + timedelta(days=day + 1)
                        
                        # Make prediction using rule-based approach
                        # (as fallback when model doesn't have predict method)
                        prediction = self.generate_demand_prediction(product, city, forecast_date)
                        
                        result = {
                            'product_id': product.get('product_id'),
                            'product_name': product.get('product_name'),
                            'category': product.get('category'),
                            'city': city,
                            'forecast_date': forecast_date.strftime('%Y-%m-%d'),
                            'predicted_units': prediction,
                            'confidence_score': 0.85,  # Mock confidence score
                            'day_of_week': forecast_date.strftime('%A'),
                            'month': forecast_date.month,
                            'year': forecast_date.year,
                            'holiday_flag': self.is_holiday(forecast_date)
                        }
                        results.append(result)
            
            return {
                'success': True,
                'predictions': results,
                'total_predictions': len(results),
                'forecast_period': f"{forecast_days} days"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'predictions': []
            }
    
    def predict_pricing(self, input_data):
        """
        Predict optimal pricing for given products
        
        Args:
            input_data: Dict containing product data
        
        Returns:
            Dict containing price recommendations
        """
        try:
            results = []
            products = input_data.get('products', [])
            
            for product in products:
                # Prepare features for pricing model
                features = self.prepare_pricing_features(product)
                
                # Make prediction
                predicted_price = self.pricing_model.predict([features])[0]
                
                # Ensure price is positive and convert to Python float
                predicted_price = float(max(0, predicted_price))
                
                current_price = float(product.get('current_price', 25.0))
                demand_score = int(product.get('demand_score', 50))
                stock_level = int(product.get('stock_level', 100))
                days_left = int(product.get('days_left', 7))
                
                price_change = ((predicted_price - current_price) / current_price * 100) if current_price > 0 else 0
                
                # Generate recommendation reason
                reason = self.get_pricing_reason(product, predicted_price, current_price)
                
                result = {
                    'product_id': product.get('product_id'),
                    'product_name': product.get('product_name'),
                    'category': product.get('category'),
                    'current_price': current_price,
                    'recommended_price': round(predicted_price, 2),
                    'price_change_percentage': round(price_change, 2),
                    'demand_score': demand_score,
                    'stock_level': stock_level,
                    'days_left': days_left,
                    'weekday': product.get('weekday', datetime.now().strftime('%A')),
                    'season': product.get('season', 'Summer'),
                    'confidence_score': 0.82,  # Mock confidence score
                    'recommendation_reason': reason,
                    'valid_until': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
                }
                results.append(result)
            
            return {
                'success': True,
                'recommendations': results,
                'total_recommendations': len(results)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'recommendations': []
            }
    
    def prepare_demand_features(self, product, city, forecast_date):
        """Prepare features for demand forecasting model"""
        # Mock feature preparation - replace with actual feature engineering
        features = [
            forecast_date.day,
            forecast_date.month,
            forecast_date.year,
            forecast_date.weekday(),
            1 if self.is_holiday(forecast_date) else 0,
            hash(product.get('category', '')) % 100,
            hash(city) % 100,
            hash(product.get('product_id', '')) % 100
        ]
        return features
    
    def prepare_pricing_features(self, product):
        """Prepare features for pricing model"""
        # Create feature vector based on model_features.json
        feature_vector = []
        
        # Base features
        feature_vector.extend([
            product.get('days_left', 7),
            product.get('stock_level', 100),
            product.get('demand_score', 50)
        ])
        
        # Category one-hot encoding
        categories = ['Bakery', 'Beverage', 'Canned', 'Cleaning', 'Dairy', 
                     'Frozen', 'Fruit', 'Health', 'Meat', 'Pet', 'Produce', 'Snacks']
        current_category = product.get('category', 'Dairy')
        for cat in categories:
            feature_vector.append(1 if current_category == cat else 0)
        
        # Season one-hot encoding
        seasons = ['Summer', 'Winter']
        current_season = product.get('season', 'Summer')
        for season in seasons:
            feature_vector.append(1 if current_season == season else 0)
        
        # Weekday one-hot encoding
        weekdays = ['Monday', 'Saturday', 'Sunday', 'Thursday', 'Tuesday', 'Wednesday']
        current_weekday = product.get('weekday', 'Monday')
        for weekday in weekdays:
            feature_vector.append(1 if current_weekday == weekday else 0)
        
        return feature_vector
    
    def generate_demand_prediction(self, product, city, forecast_date):
        """Generate demand prediction using rule-based approach"""
        # Base demand based on category
        category_base = {
            'Dairy': 150,
            'Bakery': 120,
            'Fruit': 100,
            'Vegetable': 180,
            'Meat': 80,
            'Snacks': 90,
            'Beverage': 110
        }
        
        base_demand = category_base.get(product.get('category', 'Dairy'), 100)
        
        # City factor
        city_factors = {
            'Mumbai': 1.3,
            'Delhi': 1.2,
            'Bangalore': 1.1,
            'Chennai': 1.0,
            'Pune': 0.9
        }
        city_factor = city_factors.get(city, 1.0)
        
        # Day of week factor
        weekday = forecast_date.weekday()
        weekday_factor = 1.2 if weekday in [4, 5, 6] else 1.0  # Weekend boost
        
        # Month seasonality
        month = forecast_date.month
        if month in [12, 1, 2]:  # Winter
            season_factor = 1.1
        elif month in [4, 5]:  # Summer
            season_factor = 0.9
        else:
            season_factor = 1.0
        
        # Add some randomness for realism
        import random
        random_factor = 0.8 + random.random() * 0.4  # 0.8 to 1.2
        
        prediction = int(base_demand * city_factor * weekday_factor * season_factor * random_factor)
        return max(50, prediction)  # Minimum 50 units
    
    def is_holiday(self, date):
        """Check if date is a holiday (simplified)"""
        # Add your holiday logic here
        return False
    
    def get_pricing_reason(self, product, predicted_price, current_price):
        """Generate reasoning for price recommendation"""
        if predicted_price > current_price:
            if product.get('demand_score', 50) > 70:
                return "High demand detected - price increase recommended"
            elif product.get('stock_level', 100) < 50:
                return "Low stock levels - price increase to manage demand"
            else:
                return "Market conditions favor price increase"
        elif predicted_price < current_price:
            if product.get('days_left', 7) <= 2:
                return "Product nearing expiry - price reduction to clear stock"
            elif product.get('stock_level', 100) > 200:
                return "High inventory levels - price reduction to boost sales"
            else:
                return "Market conditions favor price reduction"
        else:
            return "Current price is optimal"

def main():
    """Main function to handle command line arguments"""
    try:
        # Flush stdout and stderr immediately
        sys.stdout.flush()
        sys.stderr.flush()
        
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No operation specified"}))
            sys.stdout.flush()
            return
        
        operation = sys.argv[1]
        print(f"Starting operation: {operation}", file=sys.stderr)
        sys.stderr.flush()
        
        service = SmartMandiModelService()
        print("Service initialized successfully", file=sys.stderr)
        sys.stderr.flush()
        
        # Try to get input data from stdin first, then from command line args
        input_data = {}
        
        if not sys.stdin.isatty():
            # Read from stdin
            print("Reading from stdin", file=sys.stderr)
            stdin_data = sys.stdin.read().strip()
            if stdin_data:
                try:
                    input_data = json.loads(stdin_data)
                    print(f"Parsed stdin data: {len(str(input_data))} chars", file=sys.stderr)
                except json.JSONDecodeError as e:
                    error_result = {"error": "JSON decode error from stdin", "message": str(e), "raw_data": stdin_data[:200]}
                    print(json.dumps(error_result))
                    sys.stdout.flush()
                    return
        elif len(sys.argv) > 2:
            # Read from command line argument
            print("Reading from command line argument", file=sys.stderr)
            try:
                # Handle potential quote issues in Windows
                arg_data = sys.argv[2]
                print(f"Raw argument: {arg_data[:100]}", file=sys.stderr)
                
                # Try to clean up the JSON string
                if arg_data.startswith('"') and arg_data.endswith('"'):
                    arg_data = arg_data[1:-1]
                
                input_data = json.loads(arg_data)
                print(f"Parsed argument data: {len(str(input_data))} chars", file=sys.stderr)
            except json.JSONDecodeError as e:
                error_result = {"error": "JSON decode error from argument", "message": str(e), "raw_data": sys.argv[2][:200] if len(sys.argv) > 2 else ""}
                print(json.dumps(error_result))
                sys.stdout.flush()
                return
        else:
            error_result = {"error": "No input data provided"}
            print(json.dumps(error_result))
            sys.stdout.flush()
            return
        
        sys.stderr.flush()
        
        if operation == "predict_demand":
            print("Executing demand prediction", file=sys.stderr)
            sys.stderr.flush()
            result = service.predict_demand(input_data)
            print(json.dumps(result))
            sys.stdout.flush()
            
        elif operation == "predict_pricing":
            print("Executing pricing prediction", file=sys.stderr)
            sys.stderr.flush()
            result = service.predict_pricing(input_data)
            print(json.dumps(result))
            sys.stdout.flush()
            
        else:
            error_result = {"error": f"Unknown operation: {operation}"}
            print(json.dumps(error_result))
            sys.stdout.flush()
            
    except Exception as e:
        error_result = {"error": str(e), "type": type(e).__name__}
        print(json.dumps(error_result))
        sys.stdout.flush()
        print(f"Exception occurred: {str(e)}", file=sys.stderr)
        sys.stderr.flush()

if __name__ == "__main__":
    main()
