FROM node:24.14.1-alpine

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY apps/field/package.json apps/field/package.json

RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ARG NEXT_PUBLIC_RUNTIME_DATA_MODE=seed-read

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RUNTIME_DATA_MODE=${NEXT_PUBLIC_RUNTIME_DATA_MODE}

RUN pnpm --filter @vrk/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@vrk/web", "start", "--hostname", "0.0.0.0", "--port", "3000"]
