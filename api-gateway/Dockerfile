FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our production routing config
COPY nginx.conf /etc/nginx/nginx.conf

# Validate config at build time — fails the build if nginx.conf has syntax errors
RUN nginx -t

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]