# app/backend/routes/predict.py

from flask import Blueprint, request, jsonify
from app.backend.model.model import ActivityModel
from app.backend.firebase_client import db  # Import Firestore client here
from ..switch_model import get_model, set_model
from google.cloud import firestore_v1 as firestore
import numpy as np  # Added for safe conversion of numpy types

predict_route = Blueprint('predict_route', __name__)

# Load models once
model_LSTM = ActivityModel("model/LSTM_model_50.h5")
model_SVM = ActivityModel("model/SVM_model_50.pkl", scaler_path="model/SVM_scaler_50.pkl")

@predict_route.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data or 'window' not in data:
            return jsonify({'error': 'Missing "window" in request'}), 400

        window = data['window']
        if not isinstance(window, list) or not all(isinstance(row, list) and len(row) == 3 for row in window):
            return jsonify({'error': 'Invalid window format. Expected list of [x, y, z]'}), 400

        model_type = get_model()
        if model_type == 'lstm':
            model = model_LSTM
        elif model_type == 'svm':
            model = model_SVM
        else:
            return jsonify({'error': f'Unsupported model type: {model_type}'}), 400

        window_dict = {
            'x': [row[0] for row in window],
            'y': [row[1] for row in window],
            'z': [row[2] for row in window]
        }

        activity, accuracy = model.predict_with_accuracy(window_dict)

        # 🔐 Ensure safe types
        activity = str(activity)
        accuracy = float(np.round(float(accuracy), 4))

        user_id = data.get('user_id', 'user_1')
        data_source = data.get('source', 'simulated')
        actual_activity = data.get('actual_activity')
        last_sample = window[-1] if window else [0.0, 0.0, 0.0]
        x, y, z = last_sample

        prediction_doc = {
            'user_id': user_id,
            'activity': activity,
            'accuracy': accuracy,
            'source': data_source,
            'model_used': model_type,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'sensor_data': {
                'x': float(x),
                'y': float(y),
                'z': float(z)
            }
        }

        if data_source == "simulated" and actual_activity:
            prediction_doc['actual_activity'] = str(actual_activity)

        try:
            db.collection('predictions').add(prediction_doc)
        except Exception as e:
            print(f"[ERROR] Firestore write failed: {e}")

        return jsonify({'activity': activity, 'accuracy': accuracy})

    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")
        return jsonify({'error': str(e)}), 500

@predict_route.route('/model', methods=['GET', 'POST'])
def model_selector():
    if request.method == 'GET':
        return jsonify({'active_model': get_model()})

    data = request.get_json()
    model_type = data.get('model_type', '').lower()
    if model_type not in ['svm', 'lstm']:
        return jsonify({'error': f'Unsupported model type: {model_type}'}), 400

    set_model(model_type)
    return jsonify({'message': f'Model switched to {model_type}'})