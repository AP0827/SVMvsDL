# app/backend/app.py

from flask import Flask
from flask_cors import CORS
from app.backend.routes.predict import predict_route
from app.backend.firebase_client import db  # Import Firestore client here
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.register_blueprint(predict_route, url_prefix='/api')

@app.route('/test-firestore')
def test_firestore():
    doc_ref = db.collection('predictions').document('connection_test')
    doc_ref.set({
        'user_id': 'test_user',
        'activity': 'Test Activity',
        'timestamp': datetime.utcnow().isoformat(),
        'sensor_data': {'x': 0.0, 'y': 0.0, 'z': 0.0}
    })
    return "✅ Successfully wrote to Firestore!"

if __name__ == "__main__":
    app.run(debug=True, port=5001)