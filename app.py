from flask import Flask, request, jsonify
from elasticsearch import Elasticsearch
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Connect to Elasticsearch
es = Elasticsearch('https://localhost:9200', basic_auth=('elastic', 'mUfQ+tBxNcm2Q-G+gfxx'), verify_certs=False)

# Search route
@app.route('/search', methods=['GET'])
def search_hotels():
    search_text  = request.args.get('query', '')  # Get search query
    index = request.args.get('index', 'ny_hotel_data')
    # Elasticsearch query
    query = {
        "query": {
            "multi_match" : {
                "query" : search_text,
                "fields" : [
                    "name",
                    "host_name",
                    "neighbourhood_group",
                    "neighbourhood",
                    "room_type"
                ],
                "type": "best_fields",
                "operator": "and",
            }
            
        },
        "size": 30 
    }

    try:
        # Execute query
        response = es.search(index=index, body=query)
        results = [
            hit["_source"] for hit in response["hits"]["hits"]
        ]

        # Return JSON response
        return jsonify({
            "status": "success",
            "query": search_text,
            "results": results
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
@app.route('/filter', methods=['GET'])
def search_properties():
    # Get query parameters
    price_min = request.args.get('price_min', type=float, default=0)
    price_max = request.args.get('price_max', type=float, default=1000000)  # Use large value instead of infinity
    neighborhood = request.args.get('neighborhood', type=str)
    room_type = request.args.get('room_type', type=str)

    # Build the Elasticsearch query
    must_clauses = [{"range": {"price": {"gte": price_min, "lte": price_max}}}]
    if neighborhood:
        must_clauses.append({"term": {"neighbourhood_group.keyword": neighborhood}})
    if room_type:
        must_clauses.append({"match": {"room_type": room_type}})

    query = {
        "query": {
            "bool": {
                "must": must_clauses
            }
        },
        "size": 50
    }

    try:
        # Execute the search
        response = es.search(index='ny_hotel_data', body=query)
        results = [
            hit["_source"] for hit in response["hits"]["hits"]
        ]
        return jsonify({"status": "success", "results": results}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/book', methods=['POST'])
def book_property():
    data = request.json
    property_id = data.get('id')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    print(data)
    if not property_id or not start_date or not end_date:
        return jsonify({"status": "error", "message": "Missing data"}), 400

    try:
        # Update Elasticsearch document
        es.update(
            id=property_id,
            body={
                "doc": {
                    "booked_dates": {
                        "start_date": start_date,
                        "end_date": end_date
                    }
                }
            }
        )
        return jsonify({"status": "success", "message": "Property booked successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Health check route
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    app.run(debug=True)
