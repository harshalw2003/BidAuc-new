#!/bin/bash
echo "Waiting for job-service to be healthy..."
sleep 10

echo "Seeding categories..."
docker exec job-service node src/seed/categories.js

echo "Seeding complete."
