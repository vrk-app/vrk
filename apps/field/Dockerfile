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
ARG NEXT_PUBLIC_MANUAL_SYNC_MODE=queue-preview

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_MANUAL_SYNC_MODE=${NEXT_PUBLIC_MANUAL_SYNC_MODE}

RUN pnpm --filter @vrk/field build

EXPOSE 3002

CMD ["pnpm", "--filter", "@vrk/field", "start", "--hostname", "0.0.0.0", "--port", "3002"]
