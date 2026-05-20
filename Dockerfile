# 1. Use the official lightweight Node.js image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package configuration files
COPY package*.json ./
COPY backend/package*.json ./backend/

# 4. Install backend and root dependencies
RUN npm install
RUN cd backend && npm install

# 5. Copy the backend code into the container
COPY backend ./backend

# 6. Set the default port (Hugging Face expects port 7860!)
ENV PORT=7860
EXPOSE 7860

# 7. Start the Express server!
CMD ["node", "backend/server.js"]
