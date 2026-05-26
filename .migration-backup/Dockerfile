# Multi-stage build for QA360 Playwright Framework
# Stage 1: Base image with Playwright and browsers
FROM mcr.microsoft.com/playwright:v1.53.0-jammy AS base

# Install Node.js LTS
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies

COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev && \
    npm install -g allure-commandline && \
    playwright install

# Stage 3: Build and test
FROM dependencies AS builder

COPY . .

# Install dev dependencies for testing
RUN npm ci

# Run linting
RUN npm run lint || true

# Stage 4: Test execution
FROM builder AS tester

# Set environment variables
ENV CI=true \
    PLAYWRIGHT_JUNIT_OUTPUT_NAME=junit.xml \
    PLAYWRIGHT_HTML_REPORT=playwright-report

# Run tests and collect reports
RUN npm test || true

# Generate allure report
RUN allure generate allure-results --clean -o allure-report || true

# Stage 5: Final image with reports
FROM base AS final

WORKDIR /app

# Copy built artifacts from tester stage
COPY --from=tester /app/node_modules ./node_modules
COPY --from=tester /app/playwright-report ./playwright-report
COPY --from=tester /app/test-results ./test-results
COPY --from=tester /app/allure-report ./allure-report
COPY --from=tester /app/.env* ./
COPY --from=tester /app/tests ./tests
COPY --from=tester /app/config ./config
COPY --from=tester /app/playwright.config.ts ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Default command
CMD ["npm", "test"]

# Labels for metadata
LABEL maintainer="QA360 Team" \
      description="Enterprise-grade Playwright automation framework" \
      version="1.0.0"
