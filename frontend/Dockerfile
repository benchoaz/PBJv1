FROM node:20-alpine

WORKDIR /app

# Copy package requirements first for layer caching
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start Vite dev server listening on all interfaces for Docker mapping
CMD ["npm", "run", "dev", "--", "--host"]
