FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Pas de COPY . . : le code est monté en volume par docker-compose (./frontend:/app)
# pour le hot-reload. node_modules reste dans un volume anonyme (voir compose).

EXPOSE 5173

# --host 0.0.0.0 est indispensable : sinon Vite n'écoute que sur localhost DANS le
# conteneur et reste inaccessible depuis l'extérieur (ta VM, ton navigateur).
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]