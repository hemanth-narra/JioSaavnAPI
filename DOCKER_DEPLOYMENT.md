# Docker Deployment Guide

This guide explains how to build and deploy the **JioSaavn API** application using Docker. Containerizing the app ensures it runs consistently across different environments while allowing easy management of dependencies and persistent data storage.

## Prerequisites
- **Docker**: Make sure [Docker](https://docs.docker.com/get-docker/) is installed on your machine.
- *(Optional)* **Docker Compose**: Useful for easier container management.

---

## 1. Building the Docker Image

Navigate to the project root directory (where the `Dockerfile` is located) and run the following command to build the image:

```bash
docker build -t jiosaavn-api .
```

This will read the `Dockerfile`, install all necessary Python dependencies from `requirements.txt`, and package the application into an image named `jiosaavn-api`.

---

## 2. Running the Application

### Basic Run
You can run the container using a simple `docker run` command. By default, the app exposes port `5100`.

```bash
docker run -d -p 5100:5100 --name jiosaavn-app jiosaavn-api
```

- `-d`: Runs the container in detached mode (in the background).
- `-p 5100:5100`: Maps port 5100 of your host machine to port 5100 inside the container.
- `--name`: Gives the container a recognizable name.

### Running with Persistent Database Storage (Recommended)
The application uses a SQLite database to save user data (favorites, playlists, etc.). Currently, this data is saved inside the container at `/app/data/library.db`. 

If the container is destroyed or recreated, **you will lose this data**. To make the data persistent, you must map a local folder to the container's data directory using a volume:

```bash
# Create a local data directory first
mkdir -p ./jiosaavn-data

# Run the container with a volume map
docker run -d \
  -p 5100:5100 \
  -v $(pwd)/jiosaavn-data:/app/data \
  --name jiosaavn-app \
  jiosaavn-api
```

### Passing Environment Variables
You can customize the deployment by passing environment variables when running the container. 
Supported variables include:
- `PORT`: (Default: `5100`). The port Gunicorn should bind to.
- `SECRET`: (Default: `Auto-generated`). Secret key used by Flask.
- `DATABASE_URL`: (Default: `sqlite:////app/data/library.db`). The database connection string.

Example overriding variables:
```bash
docker run -d \
  -p 8080:8080 \
  -e PORT=8080 \
  -e SECRET="my-super-secret-key" \
  -v $(pwd)/jiosaavn-data:/app/data \
  --name jiosaavn-app \
  jiosaavn-api
```

---

## 3. Deployment using Docker Compose

If you prefer using Docker Compose (which makes managing volumes and environment variables easier), you can create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  jiosaavn-api:
    build: .
    container_name: jiosaavn-app
    ports:
      - "5100:5100"
    volumes:
      - ./jiosaavn-data:/app/data
    environment:
      - PORT=5100
      - SECRET=your_custom_secret_key_here
    restart: unless-stopped
```

Then, simply start the service by running:
```bash
docker-compose up -d
```

---

## Troubleshooting & Logs

To view the live logs coming from the Docker container to check for errors or verify that Gunicorn is running:

```bash
docker logs -f jiosaavn-app
```

To stop and remove the running container:
```bash
docker stop jiosaavn-app
docker rm jiosaavn-app
```
