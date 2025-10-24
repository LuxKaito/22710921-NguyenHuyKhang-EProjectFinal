## Features

- **Authentication service** for registering users, issuing JWTs, and protecting secured routes.
- **Product service** that maintains product data and publishes product-related messages to RabbitMQ.
- **Order service** that consumes product events, persists orders, and coordinates with RabbitMQ queues.
- **API Gateway** that forwards external traffic to the individual services and centralises routing.
- **Shared tooling** for testing with Mocha/Chai and end-to-end automation through GitHub Actions.

## Architecture

| Component | Description | Default Port |
| --- | --- | --- |
| `auth` | Handles user registration, login, and token validation against MongoDB. | `3000` |
| `product` | Manages the product catalogue and publishes events through RabbitMQ. | `3001` |
| `order` | Accepts customer orders and reacts to product events via RabbitMQ. | `3002` |
| `api-gateway` | Express + http-proxy entry point that routes `/auth`, `/products`, and `/orders` traffic. | `3003` |
| `mongo` | MongoDB instance that stores data for the services. | `27017` |
| `rabbitmq` | Message broker used for asynchronous communication between services. | `5672` (AMQP) / `15672` (management UI) |

The services communicate via REST over HTTP and publish/consume events on shared RabbitMQ queues (`orders`, `products`). Configuration defaults are provided in each service but can be overridden with environment variables.

```
.
├── api-gateway        # Reverse proxy and routing layer
├── auth               # Authentication service (MongoDB + JWT)
├── order              # Order processing service (MongoDB + RabbitMQ consumer)
├── product            # Product catalogue service (MongoDB + RabbitMQ publisher)
├── utils              # Utility libraries shared between services
├── docker-compose.yml # Spins up all services plus MongoDB & RabbitMQ
└── .github/workflows  # Continuous integration pipeline definition
```

### Environment configuration

Each service reads its configuration from environment variables with sensible defaults:

- `auth`: `PORT`, `MONGODB_AUTH_URI`, `JWT_SECRET`.
- `product`: `PORT`, `MONGODB_PRODUCT_URI`, `RABBITMQ_URI`, `RABBITMQ_ORDER_QUEUE`, `RABBITMQ_PRODUCT_QUEUE`, `JWT_SECRET`, `RABBITMQ_CONNECT_DELAY_MS`.
- `order`: `PORT`, `MONGODB_ORDER_URI`, `RABBITMQ_URI`, `RABBITMQ_ORDER_QUEUE`, `RABBITMQ_PRODUCT_QUEUE`, `JWT_SECRET`, `RABBITMQ_CONNECT_DELAY_MS`.
- `api-gateway`: `PORT`, `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL` or their respective `_HOST`/`_PORT` overrides.

Copy the required variables into `.env` files under each service (e.g. `auth/.env`, `product/.env`, etc.) before running the stack.

> **RabbitMQ credentials:** Docker Compose now provisions RabbitMQ with the `app` / `app` user. The services default to `amqp://app:app@rabbitmq:5672`, so update any custom `.env` files to match.

### Run with Docker Compose

1. Ensure Docker is running.
2. Build and start the full stack:

   ```bash
   docker compose up --build
   ```

3. Access the services through the API gateway at `http://localhost:3003`. The gateway proxies requests to `/auth`, `/products`, and `/orders`.

4. Stop the stack when you are done:

   ```bash
   docker compose down
   ```

### Run services locally (without Docker)

Each service can also be started from the host machine:

```bash
# From the repository root
npm install

# Install dependencies inside individual services if needed
npm install --prefix auth
npm install --prefix product
npm install --prefix order
npm install --prefix api-gateway

# Start a service
npm start --prefix auth
```

Ensure MongoDB and RabbitMQ are available locally (the defaults assume `localhost`).

## Testing

Run the service-level test suites with Mocha/Chai via the repository root:

```bash
npm test
```

You can also target a specific service:

```bash
npm test --prefix auth
npm test --prefix product
npm test --prefix order
```

## Continuous Integration

GitHub Actions runs the workflow defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on each push and pull request. The pipeline:

1. Checks out the repository and sets up Node.js 18 with npm caching.
2. Installs dependencies and executes the shared test suite (`npm ci && npm test`).
3. Builds Docker images for every service to catch Dockerfile regressions.
4. On pushes to `main` or `master`, logs in to Docker Hub (using repository secrets) and pushes tagged images for each service.

You can manually trigger the pipeline or monitor its status from the **Actions** tab in GitHub. The status badge at the top of this README reflects the most recent workflow run.

## Troubleshooting

- RabbitMQ services may need a few seconds to accept connections. Adjust `RABBITMQ_CONNECT_DELAY_MS` in the service `.env` files if you encounter connection failures during startup.
- If Docker builds cannot authenticate to Docker Hub, double-check that the `DOCKER_NAME` and `DOCKER_TOKEN` secrets are configured in your GitHub repository settings.
- Remove `node_modules` directories before rebuilding containers if you experience mismatched native dependencies.


## Contributing

Issues and pull requests are welcome! Please open a ticket describing the change, ensure tests pass locally, and link to any relevant GitHub Actions runs.
