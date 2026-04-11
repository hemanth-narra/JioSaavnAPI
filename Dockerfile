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

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Environment variable for the database path
ENV DATABASE_URL=sqlite:////app/data/library.db
ENV PORT=5100

# Expose the port
EXPOSE $PORT

# Start the application using the gunicorn command
CMD gunicorn app:app --bind 0.0.0.0:${PORT:-5100} --timeout 100 --log-file=-
