from backend.llm import ask_llm

def run_moti_agent(msg):
    return ask_llm("You are MOTI AI assistant", msg)