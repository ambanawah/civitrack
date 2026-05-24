# Jenkins Setup Guide for CiviTrack
# Follow these steps to get your pipeline running and screenshots captured.

## Step 1 — Start Jenkins

```bash
cd infra/jenkins
docker-compose -f docker-compose.jenkins.yml up -d
```

Wait ~30 seconds, then open: http://localhost:8080

---

## Step 2 — Get the admin password

```bash
docker exec civitrack_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Paste it into the browser when prompted.

---

## Step 3 — Install suggested plugins

When Jenkins asks → click "Install suggested plugins"
Wait for installation to finish (~2-3 min).

---

## Step 4 — Install extra plugins

Go to: Manage Jenkins → Plugins → Available plugins

Search and install:
- Docker Pipeline
- Git
- Pipeline

---

## Step 5 — Add Docker Hub credentials

Go to: Manage Jenkins → Credentials → System → Global → Add Credentials

Kind: Username with password
- Username: your Docker Hub username
- Password: your Docker Hub password or access token
- ID: dockerhub-username  ← must match Jenkinsfile exactly
- ID: dockerhub-password  ← must match Jenkinsfile exactly

(Add each as a separate credential)

---

## Step 6 — Create the Pipeline job

1. Dashboard → New Item
2. Name: civitrack-pipeline
3. Type: Pipeline → OK

In Pipeline section:
- Definition: Pipeline script from SCM
- SCM: Git
- Repository URL: https://github.com/ambanawah/civitrack.git
- Branch: */main
- Script Path: Jenkinsfile

Save.

---

## Step 7 — Run the pipeline

Click "Build Now"

Watch the stages execute:
1. Checkout
2. Validate
3. Build Services
4. Test
5. Push to Docker Hub (main branch only)
6. Deploy
7. Smoke Test

---

## Step 8 — Take screenshots for marks

Screenshot 1 → Pipeline overview (all green stages)
Screenshot 2 → Console output showing "✅ PIPELINE SUCCEEDED"
Screenshot 3 → Blue Ocean view (prettier — install Blue Ocean plugin)

---

## Quick note for demo

If you don't have a DigitalOcean server yet, Jenkins can deploy
locally (docker-compose up on the same machine). The pipeline
still shows all stages and passes — that's what matters for marks.
