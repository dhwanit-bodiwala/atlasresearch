import time

def emit_event(emit, event_type: str, **kwargs):
    """
    Helper to emit structured WebSocket event dictionaries to the queue.
    If `emit` is None (e.g. synchronous CLI execution), this is a no-op.
    """
    if emit is not None:
        emit({
            "type": event_type,
            "timestamp": time.time(),
            "data": kwargs
        })
