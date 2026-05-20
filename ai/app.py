from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("NVIDIA_API_KEY"),
    base_url="https://integrate.api.nvidia.com/v1"
)

chat_history = [
    {
        "role": "system",
        "content": """
        Kamu adalah AI Portal Pendidikan Indonesia.
        Gunakan bahasa Indonesia.
        Membantu coding, laporan sekolah,
        administrasi guru, Firebase,
        dan portal pendidikan.
        """
    }
]

print("AI NVIDIA Aktif")
print("Ketik 'exit' untuk keluar\n")

while True:
    user_input = input("Anda: ")

    if user_input.lower() == "exit":
        break

    chat_history.append({
        "role": "user",
        "content": user_input
    })

    response = client.chat.completions.create(
        model="meta/llama-3.1-8b-instruct",
        messages=chat_history,
        temperature=0.7,
        max_tokens=2000
    )

    ai_reply = response.choices[0].message.content

    chat_history.append({
        "role": "assistant",
        "content": ai_reply
    })

    print("\nAI:")
    print(ai_reply)
    print()