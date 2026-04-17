import pandas as pd

def preprocess_input(data: dict, model_columns: list) -> pd.DataFrame:
    dt = pd.to_datetime(data['date'])
    day = dt.day
    month = dt.month
    
    input_data = {
        'Total_Stops': [data['stops']],
        'Duration': [data['duration']],
        'Day': [day],
        'Month': [month]
    }
    
    df = pd.DataFrame(input_data)
    
    for col in model_columns:
        if col not in df.columns:
            df[col] = 0
            
    airline_col = f"Airline_{data['airline']}"
    source_col = f"Source_{data['source']}"
    dest_col = f"Destination_{data['destination']}"
    
    if airline_col in df.columns: df[airline_col] = 1
    if source_col in df.columns: df[source_col] = 1
    if dest_col in df.columns: df[dest_col] = 1
    
    df = df[model_columns]
    
    return df
