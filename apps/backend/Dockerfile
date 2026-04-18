# apps/backend/Dockerfile

# ============================================
# Stage 1: Сборка
# ============================================
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

# sqlc генерируем прямо в build-stage, чтобы контейнерная сборка не зависела от
# того, был ли generated-код подготовлен заранее в локальном окружении.
RUN go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY sqlc.yaml ./
COPY internal/db/queries ./internal/db/queries
COPY migrations ./migrations
RUN sqlc generate

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/bin/api \
    ./cmd/api

# ============================================
# Stage 2: Финальный образ
# ============================================
FROM alpine:3.19

# wget нужен для compose healthcheck внутри контейнера backend (`/healthz`).
RUN apk add --no-cache ca-certificates tzdata wget

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/bin/api /app/api

COPY --chown=appuser:appgroup migrations /app/migrations

RUN chown -R appuser:appgroup /app

USER appuser

WORKDIR /app

EXPOSE 8080

ENTRYPOINT ["/app/api"]
