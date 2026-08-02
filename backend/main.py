import queue
import time
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from orchestrator import run_orchestrator
from chat import router as chat_router
from ingest import router as ingest_router

app = FastAPI()
app.include_router(chat_router,prefix="/chat")
app.include_router(ingest_router,prefix="/ingest")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestBody(BaseModel):
    question: str
    project_tag: str
    deep_research: bool = False


@app.get("/")
async def intro():
    return "AtlasResearch"


@app.post("/research")
def research(request: RequestBody):

    question = request.question
    project_tag = request.project_tag
    deep_research = request.deep_research

    response = run_orchestrator(question=question, project_tag=project_tag, deep_research=deep_research)

    if response is None:
        raise HTTPException(status_code=404, detail="Something went wrong")

    return response


def _run_pipeline_in_thread(q: queue.Queue, question: str, project_tag: str, deep_research: bool):
    """
    Runs on a worker thread (via asyncio.to_thread). Never touches the socket
    directly — only ever puts plain dicts on the queue. emit=q.put is passed
    straight into the orchestrator, which passes it down into each agent.
    Always ends by putting a None sentinel, whether the pipeline finished
    cleanly, stopped early, or raised — so the async reader loop can never
    hang waiting on a queue that will never receive anything else.
    """
    try:
        run_orchestrator(
            question=question,
            project_tag=project_tag,
            deep_research=deep_research,
            emit=q.put,
        )
    except Exception as e:
        q.put({"type": "pipeline_error", "timestamp": time.time(), "data": {"message": str(e)}})
    finally:
        q.put(None)  # sentinel — tells the reader loop there's nothing more coming


@app.websocket("/ws/research")
async def research_ws(websocket: WebSocket):
    await websocket.accept()

    try:
        raw = await websocket.receive_json()
        request = RequestBody(**raw)
    except (ValidationError, ValueError) as e:
        await websocket.send_json({"type": "pipeline_error", "timestamp": time.time(), "data": {"message": f"invalid request: {e}"}})
        await websocket.close()
        return
    except WebSocketDisconnect:
        return

    q: queue.Queue = queue.Queue()

    # Fire the (blocking) orchestrator on a worker thread so it doesn't stall
    # this coroutine's event loop. asyncio.create_task so we can concurrently
    # drain the queue below rather than waiting for it to finish first.
    asyncio.create_task(
        asyncio.to_thread(
            _run_pipeline_in_thread, q, request.question, request.project_tag, request.deep_research
        )
    )

    try:
        while True:
            # queue.Queue.get() blocks, so run it in a thread too rather than
            # freezing the event loop while waiting for the next event.
            event = await asyncio.to_thread(q.get)
            if event is None:
                break
            await websocket.send_json(event)
    except WebSocketDisconnect:
        # Client closed early. The pipeline thread keeps running to completion
        # in the background (it has no idea the socket is gone) — its events
        # just get drained into a queue nobody reads anymore.
        return

    await websocket.close()