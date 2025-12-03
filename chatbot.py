import sys
import os
from typing import Final
from dotenv import load_dotenv
from openai import OpenAI
import json

# Load environment variables
load_dotenv()
AIAPI_TOKEN: Final[str] = os.getenv('AI_API')

def result(question: str) -> str:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=AIAPI_TOKEN,
    )

    completion = client.chat.completions.create(
        extra_headers={},
        extra_body={},
        model="deepseek/deepseek-chat-v3.1",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are HealBot, a friendly AI health assistant. "
                    "Answer ONLY medical/health questions simply. "
                    "List main causes/symptoms/treatments when relevant. "
                    "If not medical, respond EXACTLY: 'Sorry, I can only answer health-related questions.'"
                    "else ALWAYS end with: '*Always ask a doctor/pharmacist for personal advice.*' "
                )
            },
            {
                "role": "user", 
                "content": question
            }
        ]
    )
    
    return completion.choices[0].message.content  # Return string instead of print

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            # Parse JSON input from Node.js
            input_data = json.loads(sys.argv[1])
            question = input_data["question"]
            answer = result(question)
            
            # Output JSON response
            output = {
                'success': True,
                'question': question,
                'answer': answer
            }
            print(json.dumps(output))
        except json.JSONDecodeError:
            print(json.dumps({'success': False, 'error': 'Invalid JSON input'}))
        except Exception as e:
            print(json.dumps({'success': False, 'error': str(e)}))
    else:
        # Interactive mode stays the same
        print("loading")
        question = input("what is your question? ")
        answer = result(question)
        print(answer)

#Testcase python chatbot.py '{""question"":""What are flu symptoms?""}'