import psycopg2
from pgvector.psycopg2 import register_vector
import numpy as np
import os
import time

os.environ["HF_HUB_OFFLINE"] = "1"

_embed_load_start = time.time()
from langchain_huggingface import HuggingFaceEmbeddings as hfe
embeddings = hfe(model_name="all-MiniLM-L6-v2")
print(f"[TIMING] embedding model load: {time.time() - _embed_load_start:.2f}s  (HF_HUB_OFFLINE={os.environ.get('HF_HUB_OFFLINE')})")

def write_memory(content,type,created_by,parent_id,source,project_tag='untagged'):

    conn = psycopg2.connect("dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8")
    register_vector(conn)
    cur = conn.cursor()

    embed_vector = embeddings.embed_query(content)

    flag = cur.execute('insert into memories (content,type,project_tag,parent_id,source,embedding,created_by) values (%s,%s,%s,%s,%s,%s,%s) returning id',(content,type,project_tag,parent_id,source,embed_vector,created_by))

    id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return id


def read_memory(query,filter,limit,project_tag='untagged'):

    conn = psycopg2.connect("dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8")
    register_vector(conn)
    cur = conn.cursor()

    embed = embeddings.embed_query(query)

    if filter is None:
        result = cur.execute("select * from memories where status='ACTIVE' and project_tag=%s ORDER BY embedding <=> %s::vector limit %s",(project_tag,embed,limit))
    else:
        result = cur.execute("select * from memories where status='ACTIVE' and project_tag=%s and type=%s ORDER BY embedding <=> %s::vector limit %s",(project_tag,filter,embed,limit))

    ans = cur.fetchall()

    cur.close()
    conn.close()

    return ans


def count_memories(type: str, project_tag: str = 'untagged') -> int:
    """
    Returns how many ACTIVE memories of a given type exist for a project_tag.
    Used to size adaptive limits (e.g. how many RAW_FINDINGs to pull for synthesis)
    relative to how much material actually exists, instead of guessing a fixed number.
    """
    conn = psycopg2.connect("dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8")
    register_vector(conn)
    cur = conn.cursor()

    cur.execute(
        "SELECT COUNT(*) FROM memories WHERE status='ACTIVE' AND project_tag=%s AND type=%s",
        (project_tag, type)
    )
    count = cur.fetchone()[0]

    cur.close()
    conn.close()

    return count


def supersede_memories(type: str, project_tag: str = 'untagged') -> int:
    """
    Marks all ACTIVE memories of a given type/project_tag as SUPERSEDED.
    Used before writing a new SYNTHESIS, so stale versions stop competing
    with the current one in semantic search results.
    Returns the number of rows updated.
    """
    conn = psycopg2.connect("dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8")
    register_vector(conn)
    cur = conn.cursor()

    cur.execute(
        "UPDATE memories SET status = 'SUPERSEDED' WHERE status = 'ACTIVE' AND type = %s AND project_tag = %s",
        (type, project_tag)
    )
    updated_count = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    return updated_count


# write_memory(content="hello this is test1",type="NOTE",created_by="user",parent_id=None,source=None)