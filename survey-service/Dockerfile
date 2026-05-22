FROM ghcr.io/puppeteer/puppeteer:latest
USER root
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_CACHE_DIR=/app/.cache
RUN npm install
COPY server.js .
RUN chown -R pptruser:pptruser /app
USER pptruser
EXPOSE 3001
CMD ["node", "server.js"]
