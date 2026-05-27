from django.conf import settings
from openai import OpenAI


def send_message(system: str, messages: list[dict]) -> tuple[str, int, int]:
    """
    Call the OpenAI chat completions API.
    Returns (response_content, input_tokens, output_tokens).
    Raises openai.OpenAIError on API failure.
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "system", "content": system}, *messages],
    )

    content = response.choices[0].message.content
    input_tokens = response.usage.prompt_tokens
    output_tokens = response.usage.completion_tokens

    return content, input_tokens, output_tokens
