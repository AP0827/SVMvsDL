import firebase_admin
import glob
from firebase_admin import credentials, firestore

# Find the first .json file in credentials directory
json_files = glob.glob("../credentials/cred.json")
if not json_files:
    raise FileNotFoundError("No JSON file found in ../credentials/")
cred_path = json_files[0]  # Use the first matching file

# Initialize Firebase
cred = credentials.Certificate(cred_path)  # Replace with your path
firebase_admin.initialize_app(cred)
db = firestore.client()

# Fetch all documents from predictions
collection_ref = db.collection("predictions")
docs = list(collection_ref.stream())
print(f"🔍 Found {len(docs)} documents to normalize.")

updated_count = 0

for doc in docs:
    doc_data = doc.to_dict()
    updates = {}
    changed = False

    # Fix source field
    if doc_data.get("source") == "simulator":
        updates["source"] = "simulated"
        changed = True

    # Normalize accuracy/confidence
    if "confidence" in doc_data and "accuracy" not in doc_data:
        updates["accuracy"] = doc_data["confidence"]
        updates["confidence"] = firestore.DELETE_FIELD
        changed = True

    elif "confidence" in doc_data and "accuracy" in doc_data:
        updates["confidence"] = firestore.DELETE_FIELD
        changed = True

    # Apply updates
    if changed:
        doc.reference.update(updates)
        updated_count += 1

print(f"✅ Normalized {updated_count} documents in Firestore.")