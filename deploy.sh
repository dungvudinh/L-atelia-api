#!/bin/bash
echo "Starting Deployment..."
git pull origin main
npm install
npm run build
pm2 restart latelia-api
echo "Deployment Completed!"