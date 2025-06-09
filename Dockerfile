# Dockerfile - FINAL VERSION

# --- Stage 1: The "Builder" ---
# This stage installs all dependencies (including dev) and builds the application.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the production build command
RUN npm run build


# --- Stage 2: The "Runner" ---
# This stage creates the final, lean image for production.
FROM node:18-alpine

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the server and the built application from the "builder" stage
COPY server.js .
COPY --from=builder /app/dist ./dist

# The database will be mounted as a volume, so we don't copy it.
# This ensures data persists between container restarts.

# Expose the port the app runs on
EXPOSE 3000

# The command to start the server
CMD [ "node", "server.js" ]
