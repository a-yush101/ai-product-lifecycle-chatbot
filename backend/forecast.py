import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No data provided"}))
        return

    try:
        data_json = sys.argv[1]
        data = json.loads(data_json)
        
        if not data or len(data) < 2:
            print(json.dumps({"error": "Insufficient data for forecasting"}))
            return
            
        df = pd.DataFrame(data)
        
        # We assume 'sales' is the target column
        if 'sales' not in df.columns:
            print(json.dumps({"error": "Data must contain a 'sales' column"}))
            return

        # Handle missing or invalid sales values
        df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
        df = df.dropna(subset=['sales'])

        if len(df) < 2:
            print(json.dumps({"error": "Insufficient valid sales data"}))
            return

        # Try to parse dates
        is_date = False
        if 'month' in df.columns:
            try:
                # Let's try parsing
                pd.to_datetime(df['month'], format='mixed')
                df['date'] = pd.to_datetime(df['month'])
                is_date = True
            except:
                pass

        # Create a time index for regression
        df['time_index'] = np.arange(len(df))
        
        X = df[['time_index']]
        y = df['sales']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Save model in the same directory as the script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'model.pkl')
        joblib.dump(model, model_path)
        
        # Forecast next 3 periods
        last_index = df['time_index'].max()
        future_X = pd.DataFrame({'time_index': [last_index + 1, last_index + 2, last_index + 3]})
        forecast = model.predict(future_X)
        
        forecast_periods = []
        if is_date:
            last_date = df['date'].iloc[-1]
            if len(df) > 1:
                diff = df['date'].diff().mean()
            else:
                diff = pd.Timedelta(days=30)
            
            for i in range(1, 4):
                next_date = last_date + (diff * i)
                forecast_periods.append(next_date.strftime('%b %Y'))
        else:
            for i in range(1, 4):
                last_month_str = str(df['month'].iloc[-1] if 'month' in df.columns else "")
                import re
                match = re.match(r'([^\d]+)(\d+)', last_month_str)
                if match:
                    prefix = match.group(1)
                    num = int(match.group(2))
                    forecast_periods.append(f"{prefix}{num + i}")
                else:
                    forecast_periods.append(f"Period {int(last_index + 1 + i)}")

        # Format the result
        result = {
            "forecast": [
                {"period": forecast_periods[0], "sales": int(round(forecast[0]))},
                {"period": forecast_periods[1], "sales": int(round(forecast[1]))},
                {"period": forecast_periods[2], "sales": int(round(forecast[2]))}
            ],
            "trend": "upward" if model.coef_[0] > 0 else "downward",
            "growth_rate": round(model.coef_[0], 2)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
