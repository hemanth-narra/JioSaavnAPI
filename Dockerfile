# Base image matching the runtime.txt specification
FROM python:3.8-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY . .

# Environment variable for the port, defaults to 5100 matching app.py
ENV PORT=5100

# Expose the port
EXPOSE $PORT

# Start the application using the gunicorn command from Procfile and bind to the specified PORT
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 100 --log-file=-
