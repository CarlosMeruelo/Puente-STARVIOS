FROM node:20-bookworm

RUN apt-get update --fix-missing && apt-get install -y --fix-missing \
    ffmpeg \
    xvfb \
    chromium \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json .
RUN npm install
COPY index.js .

CMD ["node", "index.js"]
