# ZenMind - Default Containerfile (Fedora 44 Base)
# For detailed customization see Dockerfile.fedora44
FROM docker.io/library/fedora:44

LABEL maintainer="KYBT Consulting <support@kybtconsulting.com>"
LABEL org.opencontainers.image.title="ZenMind"
LABEL org.opencontainers.image.description="Open-source EdrawMind alternative for cross-platform mind mapping"
LABEL org.opencontainers.image.url="https://github.com/KYBT-Consulting/zenmind"
LABEL org.opencontainers.image.vendor="KYBT Consulting"
LABEL org.opencontainers.image.licenses="MIT"

RUN dnf -y --setopt=install_weak_deps=False --nodocs install \
    gcc \
    gcc-c++ \
    make \
    git \
    curl \
    wget \
    file \
    tar \
    gzip \
    xz \
    openssl-devel \
    webkit2gtk4.1-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    libxdo-devel \
    rpm-build \
    cargo \
    rust && \
    dnf clean all && \
    rm -rf /var/cache/dnf /var/cache/yum

# Install Node.js 26 (Current) from official distribution
RUN curl -fsSL https://nodejs.org/dist/latest-v26.x/node-v26.11.1-linux-x64.tar.gz | tar -xzf - -C /usr/local --strip-components=1 --no-same-owner && \
    node -v && npm -v

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build && \
    npx tauri build --bundles rpm,appimage

RUN useradd -m -u 1000 zenmind && \
    mkdir -p /dist && \
    cp -r src-tauri/target/release/bundle/* /dist/ && \
    chown -R zenmind:zenmind /app /dist 2>/dev/null || true

USER zenmind
WORKDIR /home/zenmind

ENV DISPLAY=:0
ENV WAYLAND_DISPLAY=wayland-0

VOLUME ["/dist"]

CMD ["/app/src-tauri/target/release/zenmind"]
