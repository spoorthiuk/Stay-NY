from elasticsearch import Elasticsearch, helpers
import json

es = Elasticsearch('https://localhost:9200', http_auth=('elastic', 'mUfQ+tBxNcm2Q-G+gfxx'), verify_certs=False)
total_records = 0
index_name = 'ny_hotel_data'
file_path = 'airbnb_data.json'
def index_data():
    try:
        with open(file_path, 'r') as json_file:
            for line in json_file:
                try:
                    record = json.loads(line.strip())
                    response = es.index(index=index_name, document=record)
                    if response.get('result') in ['created', 'updated']:
                        total_records += 1
                except Exception as e:
                    print("Error indexing record: {}".format(e))
        print("Total records added to Elasticsearch: {}".format(total_records))
    except Exception as e:
        print("Error reading file or connecting to Elasticsearch: {}".format(e))


query = {
    "size": 0,  # No documents are returned, only aggregation results
    "aggs": {
        "unique_room_types": {
            "terms": {
                "field": "neighbourhood_group.keyword",  # Ensure 'keyword' field type for aggregation
                "size": 10  # Adjust size based on expected unique values
            }
        }
    }
}

# Perform the search
response = es.search(index=index_name, body=query)

# Print the aggregation results
buckets = response["aggregations"]["unique_room_types"]["buckets"]
for bucket in buckets:
    print(f"Room Type: {bucket['key']}, Count: {bucket['doc_count']}")
