FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PROTO_HOME=/root/.proto
ENV PATH=/root/.proto/shims:/root/.proto/bin:$PATH
ENV COPILOT_MODEL=gpt-5.2-codex
ENV COPILOT_TIMEOUT_MS=180000
ENV COPILOT_START_TIMEOUT_MS=30000
ENV COPILOT_FLEET_TIMEOUT_MS=180000
ENV COPILOT_FLEET_POLL_MS=5000
ENV COPILOT_FLEET_IDLE_GRACE_MS=30000
ENV COPILOT_EVENT_LOG=compact
ENV NODE_OPTIONS=--no-deprecation

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    libatomic1 \
    ripgrep \
    unzip \
    xz-utils \
    zsh \
  && rm -rf /var/lib/apt/lists/*

RUN bash -c 'bash <(curl -fsSL https://moonrepo.dev/install/proto.sh)'

WORKDIR /workspace

COPY .prototools package.json pnpm-lock.yaml ./
RUN proto install
RUN pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["pnpm", "run", "lab:help"]
