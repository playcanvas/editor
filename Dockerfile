FROM ghcr.io/playcanvas/editor/test:latest AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json package-lock.json /temp/dev/
RUN cd /temp/dev && npm ci

FROM base AS builder
COPY --from=install /temp/dev/package.json /temp/dev/package-lock.json ./
COPY --from=install /temp/dev/node_modules ./node_modules

# build js + css
COPY src ./src
COPY sass ./sass
COPY static ./static
COPY types.d.ts ./
COPY tsconfig.json ./
COPY vite.config.mjs ./
RUN npm run build

FROM base AS run
COPY --from=install /temp/dev/package.json /temp/dev/package-lock.json ./
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

CMD ["/bin/bash", "-c", "npm run serve & SERVE_PID=$!; \
    npm run test --prefix /usr/src/test; \
    TEST_EXIT_CODE=$?; \
    kill $SERVE_PID; \
    exit $TEST_EXIT_CODE"]
