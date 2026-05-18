FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

# Default envs (can be overridden by docker-compose)
ENV NODE_ENV=production

# Run scraper
CMD ["node", "src/index.js"]
