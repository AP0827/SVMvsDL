import firebase_admin
import glob
from firebase_admin import credentials, firestore
import os
# Find the first .json file in credentials directory
json_files = glob.glob("../credentials/cred.json")
if not json_files:
    raise FileNotFoundError("No JSON file found in ../credentials/")
cred_path = json_files[0]  # Use the first matching file
# Initialize Firebase Admin SDK
cred = credentials.Certificate(cred_path)  # Replace with actual path
firebase_admin.initialize_app(cred)
db = firestore.client()

# Read and parse the WISDM_raw.txt file
file_path = "../simulator/WISDM_raw.txt"
parsed_lines = []

with open(file_path, "r") as file:
    for line in file:
        try:
            parts = line.strip().strip(";").split(",")
            user_id = str(parts[0])
            activity = parts[1]
            x = round(float(parts[-3]), 3)
            y = round(float(parts[-2]), 3)
            z = round(float(parts[-1]), 3)
            parsed_lines.append({
                "user_id": user_id,
                "actual_activity": activity,
                "sensor_data": {"x": x, "y": y, "z": z}
            })
        except Exception as e:
            print(f"[WARN] Skipped line: {line.strip()} due to {e}")

print(f"📄 Parsed {len(parsed_lines)} records from WISDM_raw.txt")

# Fetch all prediction documents
collection_ref = db.collection("predictions")
docs = list(collection_ref.stream())
print(f"📁 Found {len(docs)} prediction documents in Firestore")

# Match and update Firestore documents
updated = 0
used_indexes = set()

for doc in docs:
    doc_ref = doc.reference

    for i, line in enumerate(parsed_lines):
        if i in used_indexes:
            continue

        firestore_sensor = doc.to_dict().get("sensor_data", {})
        fx = round(firestore_sensor.get("x", 0.0), 3)
        fy = round(firestore_sensor.get("y", 0.0), 3)
        fz = round(firestore_sensor.get("z", 0.0), 3)

        lx = line["sensor_data"]["x"]
        ly = line["sensor_data"]["y"]
        lz = line["sensor_data"]["z"]

        if (fx, fy, fz) == (lx, ly, lz):
            # Overwrite user_id and sensor_data, and add actual_activity
            doc_ref.update({
                "user_id": line["user_id"],
                "sensor_data": line["sensor_data"],
                "actual_activity": line["actual_activity"]
            })
            updated += 1
            used_indexes.add(i)
            break

print(f"✅ Updated {updated} documents with actual_activity, user_id, and sensor_data.")