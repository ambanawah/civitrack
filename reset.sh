#!/bin/bash

echo "=============================="
echo " CiviTrack - System Reset"
echo "=============================="

echo ""
echo "→ Stopping all containers..."
docker-compose down -v

echo ""
echo "→ Rebuilding and starting..."
docker-compose up --build -d

echo ""
echo "→ Waiting for services to be ready..."
sleep 8

echo ""
echo "→ Health check..."
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || \
curl -s http://localhost:3000/health

echo ""
echo "=============================="
echo " System ready at:"
echo " Gateway  → http://localhost:3000"
echo " Auth     → http://localhost:3001"
echo " Complaints → http://localhost:3002"
echo "=============================="
