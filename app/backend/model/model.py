from tensorflow.keras.models import load_model
import numpy as np
import joblib
import os

class ActivityModel:
    def __init__(self, model_path, scaler_path=None):
        self.is_lstm = model_path.endswith('.h5')
        self.labels = ['Walking', 'Running', 'Standing', 'Sitting', 'Upstairs', 'Downstairs']

        base_dir = os.path.dirname(os.path.abspath(__file__))

        if self.is_lstm:
            full_path = os.path.join(base_dir, "LSTM_model_50.h5")
            self.model = load_model(full_path)
        else:
            full_model_path = os.path.join(base_dir, "SVM_model_50.pkl")
            self.model = joblib.load(full_model_path)
            if scaler_path is None:
                raise ValueError("Scaler path must be provided for SVM model.")
            full_scaler_path = os.path.join(base_dir, "SVM_scaler_50.pkl")
            self.scaler = joblib.load(full_scaler_path)

    def predict_with_accuracy(self, window_dict):
        if self.is_lstm:
            X = np.array([list(t) for t in zip(window_dict['x'], window_dict['y'], window_dict['z'])])
            X = X.reshape(1, X.shape[0], 3)
            y_prob = self.model.predict(X, verbose=0)[0]
            y_class = np.argmax(y_prob)
            confidence = float(y_prob[y_class])
            return self.labels[y_class], confidence
        else:
            features = []
            for axis in ['x', 'y', 'z']:
                data = np.array(window_dict[axis])
                features += [
                    data.mean(),
                    data.std(),
                    data.min(),
                    data.max(),
                    np.median(data),
                    np.sqrt(np.sum(data**2)),  # energy
                ]
            features = np.array(features).reshape(1, -1)
            features_scaled = self.scaler.transform(features)

            try:
                prediction = self.model.predict(features_scaled)[0]
                if hasattr(self.model, "predict_proba"):
                    proba = self.model.predict_proba(features_scaled)[0]
                    confidence = max(proba)
                else:
                    confidence = 1.0
            except Exception as e:
                print(f"[ERROR] SVM prediction error: {e}")
                prediction, confidence = "Unknown", 0.0

            return prediction, float(confidence)