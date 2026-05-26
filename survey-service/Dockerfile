FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# Salin package.json dengan kepemilikan pptruser
COPY --chown=pptruser:pptruser package*.json ./

# Jalankan npm install sebagai user pptruser (default di base image) agar Puppeteer mengunduh Chrome ke cache pptruser
RUN npm install

# Salin source code dengan kepemilikan pptruser
COPY --chown=pptruser:pptruser server.js .

EXPOSE 3001
CMD ["node", "server.js"]
