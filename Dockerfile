FROM node:20-alpine AS base
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS devdeps
COPY ./package.json ./pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM devdeps AS build
COPY ./src ./src
COPY ./tsconfig.json ./
RUN pnpm build

FROM base AS deps
COPY ./package.json ./pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --production

FROM deps as deploy
COPY --from=build /app/build /app/build
VOLUME ./repo /app/build/repo

CMD pnpm start
