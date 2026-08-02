from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
from agent_config import get_model, get_system_prompt, get_max_tokens
import httpx

OLLAMA_URL = "http://localhost:11434/api/chat"


router = APIRouter()

class RequestBody(BaseModel):
    messages : List 
    project_tag : str
    synthesis_id : int
    save_correction : bool = False
    correction_content : str = None


@router.post("")
def chat(request : RequestBody):

    conn = psycopg2.connect("dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8")
    cur = conn.cursor()

    cur.execute("SELECT content FROM memories WHERE id = %s AND type = 'SYNTHESIS'",(request.synthesis_id,))

    synthesis_content = cur.fetchone()

    if synthesis_content is None:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404,detail="Not Found")
    
    synthesis_content = synthesis_content[0]


    payload = {
    "model": get_model("followup"),
    "messages": [
        {"role": "system", "content": get_system_prompt("followup")},
        {"role": "system", "content": f"Research synthesis for context: {synthesis_content}"},
        *[{"role": m["role"], "content": m["content"]} for m in request.messages]
    ],
    "stream": False,
    "think": False,
    "options": {"num_predict": get_max_tokens("followup")}
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.post(OLLAMA_URL, json=payload)
        data = response.json()

    reply = data["message"]["content"]

    if request.save_correction and request.correction_content:

        cur.execute("INSERT INTO memories (project_tag,type,content,source,parent_id,created_by) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",(request.project_tag,"CORRECTION",request.correction_content,"followup",request.synthesis_id,"user"))

        id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return {"reply":reply,"correction_id":id}       

    cur.close() 
    conn.close()

    return {"reply" : reply}