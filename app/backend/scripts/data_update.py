import firebase_admin
import glob
from firebase_admin import credentials, firestore

# Load WISDM_raw.txt
with open("../simulator/WISDM_raw.txt") as f:
    wisdm_lines = [line.strip().strip(';') for line in f if line.strip()]

wisdm_data = []
for line in wisdm_lines:
    try:
        user_id, activity, _, x, y, z = line.split(',')
        wisdm_data.append({
            "user_id": user_id,
            "actual_activity": activity,
            "sensor_data": {
                "x": float(x),
                "y": float(y),
                "z": float(z)
            }
        })
    except Exception as e:
        print(f"⚠️ Skipping line: {line} due to {e}")

# Find the first .json file in credentials directory
json_files = glob.glob("../credentials/*.json")
if not json_files:
    raise FileNotFoundError("No JSON file found in ../credentials/")
cred_path = json_files[0]  # Use the first matching file

# Initialize Firebase
cred = credentials.Certificate(cred_path)  # Update path
firebase_admin.initialize_app(cred)
db = firestore.client()

# Fetch all simulated source documents (regardless of current field state)
docs = db.collection("predictions").where("source", "==", "simulated").stream()
docs = list(docs)

print(f"🔍 Found {len(docs)} simulated documents to update.")
updated_count = 0

for doc, wisdm_entry in zip(docs, wisdm_data):
    updates = {
        "actual_activity": wisdm_entry["actual_activity"],
        "user_id": wisdm_entry["user_id"],
        "sensor_data": wisdm_entry["sensor_data"]
    }
    doc.reference.update(updates)
    updated_count += 1

print(f"✅ Overwrote {updated_count} documents with fresh WISDM-based data.")