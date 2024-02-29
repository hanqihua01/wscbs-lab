# Use official Node.js image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 8000

# Run application
CMD ["npm", "start"]