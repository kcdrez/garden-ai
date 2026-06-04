import json
from collections.abc import Callable

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


def send_message_with_tools(
    system: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor: Callable[[str, dict], dict],
) -> tuple[str, int, int, dict | None]:
    """
    Call the OpenAI chat completions API with tool definitions.
    If the model invokes a tool, execute it via tool_executor, then send the
    result back for a final natural-language response.

    tool_executor(tool_name, tool_args) -> result_dict
      result_dict must include a "message" key (sent back to OpenAI as the tool
      result) and may include arbitrary metadata returned to the caller.

    Returns (content, input_tokens, output_tokens, action_result).
    action_result is the dict returned by tool_executor, or None if no tool fired.
    Raises openai.OpenAIError on API failure.
    """
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    openai_tools = [{"type": "function", "function": t} for t in tools]

    first = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "system", "content": system}, *messages],
        tools=openai_tools,
        tool_choice="auto",
    )

    input_tokens = first.usage.prompt_tokens
    output_tokens = first.usage.completion_tokens
    choice = first.choices[0]

    if not choice.message.tool_calls:
        return choice.message.content, input_tokens, output_tokens, None

    tool_calls = choice.message.tool_calls
    action_result = None
    tool_result_messages = []

    for tc in tool_calls:
        args = json.loads(tc.function.arguments)
        action_result = tool_executor(tc.function.name, args)
        tool_result_messages.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": action_result.get("message", "Done."),
        })

    assistant_msg = {
        "role": "assistant",
        "content": choice.message.content,
        "tool_calls": [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in tool_calls
        ],
    }

    second = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            *messages,
            assistant_msg,
            *tool_result_messages,
        ],
    )

    input_tokens += second.usage.prompt_tokens
    output_tokens += second.usage.completion_tokens

    return second.choices[0].message.content, input_tokens, output_tokens, action_result
