# Kubernetes Screenshot Guide
# These are the exact commands to run for your presentation screenshots.

## Prerequisites
- Docker Desktop running
- minikube installed: https://minikube.sigs.k8s.io/docs/start/
- kubectl installed: https://kubernetes.io/docs/tasks/tools/

---

## Option A — Full automated deploy (recommended)

```bash
# From project root:
bash k8s/deploy-k8s.sh
```

This does everything. When it finishes, run the screenshot commands below.

---

## Option B — Manual step by step

```bash
minikube start --driver=docker

kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/auth/db-deployment.yml
kubectl apply -f k8s/complaints/db-deployment.yml
kubectl apply -f k8s/auth/service-deployment.yml
kubectl apply -f k8s/complaints/service-deployment.yml
kubectl apply -f k8s/gateway/deployment.yml
kubectl apply -f k8s/monitoring/prometheus.yml
kubectl apply -f k8s/monitoring/grafana.yml
```

---

## Screenshot 1 — All pods running

```bash
kubectl get pods -n civitrack
```

Expected output (all STATUS = Running):
```
NAME                                  READY   STATUS    RESTARTS   AGE
auth-db-xxxx                          1/1     Running   0          2m
auth-service-xxxx                     1/1     Running   0          1m
complaint-db-xxxx                     1/1     Running   0          2m
complaint-service-xxxx                1/1     Running   0          1m
gateway-xxxx                          1/1     Running   0          1m
prometheus-xxxx                       1/1     Running   0          1m
grafana-xxxx                          1/1     Running   0          1m
```

---

## Screenshot 2 — All services

```bash
kubectl get services -n civitrack
```

---

## Screenshot 3 — Deployments (shows replicas)

```bash
kubectl get deployments -n civitrack
```

---

## Screenshot 4 — Full cluster overview (best one)

```bash
kubectl get all -n civitrack
```

---

## Screenshot 5 — Live gateway response

```bash
# Get minikube IP
minikube ip

# Hit the health endpoint
curl http://$(minikube ip):30000/health
```

---

## Screenshot 6 — Describe a pod (shows architecture knowledge)

```bash
kubectl describe pod -l app=gateway -n civitrack
```

---

## Bonus — What to say during demo

"We deployed CiviTrack as a microservices architecture on Kubernetes.
Each service runs in its own pod with its own isolated database.
No service shares a database — this is true microservice isolation.
The gateway is the only public-facing pod, exposed via NodePort.
We have health probes on every container — Kubernetes automatically
restarts any pod that becomes unhealthy."
