FROM node:18-alpine

WORKDIR /app

# Install only production deps for smaller image
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the backend source
COPY . .

EXPOSE 5000

# server.js listens on process.env.PORT (default: 5000)
CMD ["npm", "start"]

