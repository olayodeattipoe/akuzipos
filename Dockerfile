# Build stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build for production
RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Use Vite's preview server for production
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"] 