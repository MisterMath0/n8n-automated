import re

def extract_json_from_response(response_text: str) -> str:
    """Extract JSON from AI response, handling markdown blocks and extra text."""
    # Remove any text before the first JSON block
    response_text = response_text.strip()
    
    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # Try to find JSON object directly
    json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    
    # If no JSON found, return the original text
    return response_text 