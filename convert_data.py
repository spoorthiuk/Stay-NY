import pandas as pd
import json

# Load CSV
data = pd.read_csv("AB_NYC_2019.csv")

# Convert CSV to JSON
data.to_json("airbnb_data.json", orient="records", lines=True)
print("Data converted to JSON.")
