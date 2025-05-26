import firebase_admin
import glob
from firebase_admin import credentials, firestore

# Find the first .json file in credentials directory
json_files = glob.glob("../credentials/*.json")
if not json_files:
    raise FileNotFoundError("No JSON file found in ../credentials/")
cred_path = json_files[0]  # Use the first matching file
# Initialize Firebase Admin SDK
cred = credentials.Certificate(cred_path)  # <-- replace with your path
firebase_admin.initialize_app(cred)

db = firestore.client()

def remove_client_time_field():
    predictions_ref = db.collection('predictions')
    docs = predictions_ref.stream()

    updated_count = 0
    for doc in docs:
        data = doc.to_dict()
        if 'client_time' in data:
            print(f"Removing 'client_time' from document {doc.id}")
            doc.reference.update({
                'client_time': firestore.DELETE_FIELD
            })
            updated_count += 1

    print(f"Removed 'client_time' from {updated_count} documents.")

if __name__ == "__main__":
    remove_client_time_field()