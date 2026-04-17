import pandas as pd

def preprocess_input(data: dict, model_columns: list) -> pd.DataFrame:
    dt = pd.to_datetime(data['date'])
    
    input_data = {
        'total_stops': [data['total_stops']],
        'journey_day': [dt.day],
        'journey_month': [dt.month],
        'duration_minutes': [data['duration_minutes']]
    }
    
    df = pd.DataFrame(input_data)
    
    for col in model_columns:
        if col not in df.columns:
            df[col] = 0
            
    airline_col = f"airline_{data['airline']}"
    source_col = f"source_{data['source']}"
    dest_col = f"destination_{data['destination']}"
    
    if airline_col in df.columns: df[airline_col] = 1
    if source_col in df.columns: df[source_col] = 1
    if dest_col in df.columns: df[dest_col] = 1
    
    # Ensure correct column order
    df = df[model_columns]
    
    return df
