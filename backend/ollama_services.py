import ollama
from agent_config import get_model, get_system_prompt, get_max_tokens

def call_agent(role: str, prompt: str):
    model = get_model(role)
    system_prompt = get_system_prompt(role)
    token_limit = get_max_tokens(role)

    response = ollama.generate(
        model=model,
        system=system_prompt,
        prompt=prompt,
        keep_alive="6m",
        think=False,
        options={"num_predict": token_limit}
    )
    return response['response']


def unload_model(role: str):
    """
    Forces the model currently assigned to `role` to unload from memory
    immediately, freeing VRAM before a different model needs to load.
    """
    model = get_model(role)
    ollama.generate(model=model, keep_alive=0)