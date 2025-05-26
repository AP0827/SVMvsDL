import threading

_model_lock = threading.Lock()
_current_model = "lstm"

def get_model():
    with _model_lock:
        return _current_model

def set_model(model_type: str):
    if model_type not in ["svm", "lstm"]:
        raise ValueError(f"Invalid model_type: {model_type}")
    global _current_model
    with _model_lock:
        _current_model = model_type
    print(f"[INFO] Model switched to: {_current_model}")