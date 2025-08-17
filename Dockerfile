FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Create a group and user with a static ID (1001)
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

# chown is still important for files already in /usr/src/app
RUN chown -R appuser:appgroup /usr/src/app

# Switch to the non-root user
USER appuser

CMD [ "node", "index.js" ]
