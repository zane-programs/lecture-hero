# Use the official Node.js 18 alpine image as a parent image
FROM node:18-alpine

RUN apk add --no-cache curl

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install all npm dependencies
RUN npm install --save-dev

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .
COPY prestart.sh prestart.sh

# Build the application using the npm script configured in package.json
RUN npm run build

# Inform Docker that the container is listening on the specific port at runtime.
# Note: This does not actually publish the port.
EXPOSE 80

# Command to run the prestart script which should start your application
CMD ["sh", "prestart.sh"]
