#!/bin/bash

# CiviTrack — Kubernetes Deployment Script
# Run this from the project root: bash k8s/deploy-k8s.sh

set -e

echo "============================================"
echo " CiviTrack — Kubernetes Deployment"
echo "============================================"

# ── Step 1: Start minikube ───────────────────
echo ""
echo "[1/5] Starting minikube..."
minikube start --driver=docker

echo ""
echo "[2/5] Applying manifests..."

# Namespace + secrets first
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/secrets.yml

# Databases (must come before services)
kubectl apply -f k8s/auth/db-deployment.yml
kubectl apply -f k8s/complaints/db-deployment.yml

echo "  Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-db        -n civitrack --timeout=90s
kubectl wait --for=condition=ready pod -l app=complaint-db   -n civitrack --timeout=90s

# Services
kubectl apply -f k8s/auth/service-deployment.yml
kubectl apply -f k8s/complaints/service-deployment.yml
kubectl apply -f k8s/gateway/deployment.yml

# Monitoring
kubectl apply -f k8s/monitoring/prometheus.yml
kubectl apply -f k8s/monitoring/grafana.yml

echo ""
echo "[3/5] Waiting for all pods to be ready..."
sleep 10
kubectl wait --for=condition=ready pod -l app=auth-service       -n civitrack --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=complaint-service  -n civitrack --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=gateway            -n civitrack --timeout=120s || true

echo ""
echo "[4/5] Pod status:"
echo "--------------------------------------------"
kubectl get pods -n civitrack -o wide

echo ""
echo "[5/5] Services:"
echo "--------------------------------------------"
kubectl get services -n civitrack

echo ""
echo "============================================"
MINIKUBE_IP=$(minikube ip)
echo " Deployment complete!"
echo ""
echo " Gateway API → http://$MINIKUBE_IP:30000"
echo " Health check → http://$MINIKUBE_IP:30000/health"
echo " Prometheus   → http://$MINIKUBE_IP:30090"
echo " Grafana      → http://$MINIKUBE_IP:30030  (admin / civitrack123)"
echo "============================================"
