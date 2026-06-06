import os
from openai import OpenAI
from langsmith import traceable

# Create a client pointing to DeepSeek
client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com/v1"
)

@traceable(
    run_type="llm",
    name="DeepSeek Chat Completion",
    metadata={"ls_provider": "deepseek", "ls_model_name": "deepseek-chat"},
)
def call_deepseek(messages: list[dict]):
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages
    )
    return response.choices[0].message

if __name__ == "__main__":
    messages = [
        {"role": "system", "content": "You are a helpful assistant that translates English to French."},
        {"role": "user", "content": "I love programming."}
    ]
    result = call_deepseek(messages=messages)
    print("Model reply:", result.content)
