import re
import time
from fastapi import HTTPException, Request
from typing import Dict, Tuple

class RateLimiter:
    """
    In-memory Token Bucket rate limiter.
    Allows a maximum burst of requests and refills tokens at a fixed rate.
    """
    def __init__(self, requests_per_minute: int = 60, burst_limit: int = 10):
        self.rate = requests_per_minute / 60.0  # tokens per second
        self.capacity = burst_limit
        self.buckets: Dict[str, Tuple[float, float]] = {}  # ip -> (tokens, last_update_time)

    def is_allowed(self, client_ip: str) -> bool:
        current_time = time.time()
        if client_ip not in self.buckets:
            if self.capacity >= 1.0:
                self.buckets[client_ip] = (self.capacity - 1.0, current_time)
                return True
            else:
                self.buckets[client_ip] = (0.0, current_time)
                return False

        tokens, last_update = self.buckets[client_ip]
        # Calculate refilled tokens
        elapsed = current_time - last_update
        refilled = elapsed * self.rate
        new_tokens = min(self.capacity, tokens + refilled)

        if new_tokens >= 1.0:
            self.buckets[client_ip] = (new_tokens - 1.0, current_time)
            return True
        else:
            # Update the last checked time so we don't cheat the limiter
            self.buckets[client_ip] = (new_tokens, current_time)
            return False

# Global instance of rate limiter
limiter = RateLimiter(requests_per_minute=30, burst_limit=10)

def rate_limit_dependency(request: Request):
    """
    FastAPI dependency to rate limit requests based on client IP.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait before submitting more requests."
        )

def sanitize_text(text: str, max_length: int = 500) -> str:
    """
    Sanitizes user input text:
    - Truncates to max_length.
    - Strips HTML tags.
    - Removes characters that aren't letters, digits, basic punctuation, or whitespace.
    - Mitigates prompt injection jailbreaks.
    """
    if not text:
        return ""
    
    # 1. Truncate
    text = text[:max_length]
    
    # 2. Strip HTML tags
    text = re.sub(r"<[^>]*>", "", text)
    
    # 3. Allow only alphanumeric, common punctuation, and spaces
    # Prevents raw code injections or malicious control character sets
    allowed_pattern = re.compile(r"[^a-zA-Z0-9\s.,!?'\"()\-@_]")
    text = allowed_pattern.sub("", text)
    
    # 4. Prompt injection filtering: reject common jailbreak keywords
    jailbreaks = [
        "ignore previous instructions", 
        "ignore all instructions",
        "system prompt", 
        "bypass", 
        "dan mode", 
        "act as a", 
        "you are now a"
    ]
    for pattern in jailbreaks:
        if pattern in text.lower():
            # Replace jailbreak triggers with safe string
            text = re.sub(re.escape(pattern), "[redacted injection attempt]", text, flags=re.IGNORECASE)
            
    return text.strip()
