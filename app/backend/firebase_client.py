import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    # Construct absolute path to cred.json relative to this file's location
    firebase_credentials_path = os.path.join(
        os.path.dirname(__file__), "credentials", "cred.json"
    )

    if not os.path.exists(firebase_credentials_path):
        raise FileNotFoundError(f"Firebase credentials file not found at {firebase_credentials_path}")

    cred = credentials.Certificate(firebase_credentials_path)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized.")

db = firestore.client()