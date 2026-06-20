# Use official slim Python base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    ENVIRONMENT=production

# Set working directory
WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8080 (standard GCP Cloud Run port)
EXPOSE 8080

# Run the app bound to 0.0.0.0 to enable external ingress
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
