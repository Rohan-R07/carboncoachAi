import pytest
from services.huggingface_service import clean_and_parse_json

def test_parse_pure_json():
    text = '{"summary": "Healthy habits", "profile": "Green Champion", "observations": ["Good", "Better"]}'
    res = clean_and_parse_json(text)
    assert res["summary"] == "Healthy habits"
    assert res["profile"] == "Green Champion"
    assert len(res["observations"]) == 2

def test_parse_markdown_wrapped_json():
    text = """
    ```json
    {
      "week1": {
        "action": "Avoid driving",
        "goal": "Use bike",
        "outcome": "Saved carbon"
      }
    }
    ```
    """
    res = clean_and_parse_json(text)
    assert "week1" in res
    assert res["week1"]["action"] == "Avoid driving"

def test_parse_markdown_wrapped_plain_ticks():
    text = """
    ```
    {
      "key": "value"
    }
    ```
    """
    res = clean_and_parse_json(text)
    assert res["key"] == "value"

def test_parse_with_leading_trailing_chatter():
    text = """
    Here is the roadmap as requested:
    {
      "week1": {
        "action": "Unplug standby electronics"
      }
    }
    Hope this helps!
    """
    res = clean_and_parse_json(text)
    assert "week1" in res
    assert res["week1"]["action"] == "Unplug standby electronics"

def test_parse_empty_response():
    with pytest.raises(ValueError):
        clean_and_parse_json("")
        
    with pytest.raises(ValueError):
        clean_and_parse_json("   \n   ")

def test_parse_invalid_response():
    with pytest.raises(Exception):
        clean_and_parse_json("{ invalid json context }")
