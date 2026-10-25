# Official Node.js image (small Alpine variant)
FROM node:22-alpine

# Everything below happens inside /app in the container
WORKDIR /app

# Copy only the package files first, so "npm ci" is cached
# and only re-runs when dependencies change
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application source code
COPY . .

# The port the server listens on inside the container
ENV NODE_LOCAL_PORT=3020
EXPOSE 3020

CMD ["npm", "start"]
