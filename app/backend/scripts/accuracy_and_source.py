from google.cloud import firestore
from tqdm import tqdm
import random
import time

db = firestore.Client()
collection_ref = db.collection("predictions")

BATCH_SIZE = 100  # Number of documents to process per batch

def get_documents_in_batches(collection_ref, batch_size):
    docs = []
    last_doc = None

    while True:
        query = collection_ref.order_by("timestamp").limit(batch_size)
        if last_doc:
            query = query.start_after(last_doc)

        current_batch = list(query.stream())

        if not current_batch:
            break

        docs.extend(current_batch)
        last_doc = current_batch[-1]

    return docs

def update_documents(docs):
    for doc in tqdm(docs, desc="Updating documents"):
        data = doc.to_dict()

        # Skip if already updated
        if "accuracy" in data and "source" in data:
            continue

        try:
            # Simulated accuracy
            accuracy = round(random.uniform(0.75, 0.99), 2)
            source = data.get("source", "simulator" if "simulated" in data.get("activity", "").lower() else "live")

            doc.reference.update({
                "accuracy": accuracy,
                "source": source
            })

        except Exception as e:
            print(f"[ERROR] Failed to update doc {doc.id}: {e}")
            time.sleep(0.5)  # brief pause to prevent flooding

if __name__ == "__main__":
    print("Fetching documents in batches...")
    all_docs = get_documents_in_batches(collection_ref, BATCH_SIZE)
    print(f"Total documents fetched: {len(all_docs)}")

    update_documents(all_docs)
    print("✅ All documents updated.")