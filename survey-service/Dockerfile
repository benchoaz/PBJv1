FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY server.js .

EXPOSE 3001

CMD ["node", "server.js"]
