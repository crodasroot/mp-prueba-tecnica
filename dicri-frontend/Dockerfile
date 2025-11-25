# Etapa de build
FROM node:20 AS build
WORKDIR /app

# Copiar solo package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm install

# Copiar todo el código excepto lo ignorado en .dockerignore
COPY . .

# Build de producción
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

# Configuración de Nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiar la build desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Comando por defecto de Nginx
CMD ["nginx", "-g", "daemon off;"]
