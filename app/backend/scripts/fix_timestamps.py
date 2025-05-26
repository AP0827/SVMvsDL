# scripts/fix_timestamps.py

from google.cloud import firestore
from datetime import datetime
import dateutil.parser  # Handles ISO date strings robustly

# Initialize Firestore with credentials (auto-pick if set via GOOGLE_APPLICATION_CREDENTIALS)
db = firestore.Client()

def fix_timestamps():
    predictions_ref = db.collection("predictions")
    docs = predictions_ref.stream()

    updated_count = 0

    for doc in docs:
        data = doc.to_dict()
        timestamp = data.get("timestamp")

        if isinstance(timestamp, str):
            try:
                # Parse the string timestamp into datetime
                parsed_time = dateutil.parser.parse(timestamp)

                # Update Firestore with proper Timestamp object
                doc.reference.update({
                    "timestamp": firestore.SERVER_TIMESTAMP  # Or use parsed_time if exact time matters
                })
                print(f"✅ Fixed: {doc.id}")
                updated_count += 1
            except Exception as e:
                print(f"❌ Failed to parse timestamp in doc {doc.id}: {e}")

    print(f"\n🎉 Done. Documents updated: {updated_count}")

if __name__ == "__main__":
    fix_timestamps()