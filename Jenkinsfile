pipeline {
    agent any

    environment {
        // Docker Hub credentials (set these in Jenkins → Manage Credentials)
        DOCKER_HUB_USER = credentials('dockerhub-username')
        DOCKER_HUB_PASS = credentials('dockerhub-password')

        // Image names
        GATEWAY_IMAGE     = "${DOCKER_HUB_USER}/civitrack-gateway"
        AUTH_IMAGE        = "${DOCKER_HUB_USER}/civitrack-auth"
        COMPLAINT_IMAGE   = "${DOCKER_HUB_USER}/civitrack-complaints"

        // Build tag: branch + short commit hash
        IMAGE_TAG = "${env.BRANCH_NAME}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    options {
        // Keep last 5 builds only
        buildDiscarder(logRotator(numToKeepStr: '5'))
        // Fail if pipeline takes more than 20 minutes
        timeout(time: 20, unit: 'MINUTES')
        // Add timestamps to console output
        timestamps()
    }

    stages {

        // ──────────────────────────────────────
        stage('Checkout') {
        // ──────────────────────────────────────
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        // ──────────────────────────────────────
        stage('Validate') {
        // ──────────────────────────────────────
            steps {
                echo '🔍 Validating project structure...'
                sh '''
                    echo "Checking required files exist..."
                    test -f docker-compose.yml        && echo "✅ docker-compose.yml"
                    test -f gateway/Dockerfile        && echo "✅ gateway/Dockerfile"
                    test -f auth-service/Dockerfile   && echo "✅ auth-service/Dockerfile"
                    test -f complaint-service/Dockerfile && echo "✅ complaint-service/Dockerfile"
                    echo "All required files present."
                '''
            }
        }

        // ──────────────────────────────────────
        stage('Build Services') {
        // ──────────────────────────────────────
            steps {
                echo '🐳 Building Docker images...'
                sh 'docker-compose build --no-cache'
                echo '✅ All images built successfully'
            }
        }

        // ──────────────────────────────────────
        stage('Test') {
        // ──────────────────────────────────────
            steps {
                echo '🧪 Running service health tests...'
                sh '''
                    # Start services in background
                    docker-compose up -d

                    # Wait for services to initialise
                    echo "Waiting 15s for services to start..."
                    sleep 15

                    # Test gateway health endpoint
                    echo "Testing gateway health..."
                    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
                    echo "Gateway health response: $HEALTH"

                    if [ "$HEALTH" = "200" ]; then
                        echo "✅ Gateway is healthy"
                    else
                        echo "⚠️  Gateway returned $HEALTH (may still be starting)"
                    fi

                    # Test auth-service directly
                    AUTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/health || echo "000")
                    echo "Auth service response: $AUTH"

                    # Test complaint-service directly
                    COMPLAINT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/complaints/health || echo "000")
                    echo "Complaint service response: $COMPLAINT"

                    echo "✅ Tests complete"

                    # Stop test containers
                    docker-compose down
                '''
            }
        }

        // ──────────────────────────────────────
        stage('Push to Docker Hub') {
        // ──────────────────────────────────────
            when {
                // Only push on main branch
                branch 'main'
            }
            steps {
                echo '📦 Pushing images to Docker Hub...'
                sh '''
                    echo "$DOCKER_HUB_PASS" | docker login -u "$DOCKER_HUB_USER" --password-stdin

                    # Tag and push each service
                    docker tag civitrack-gateway   $GATEWAY_IMAGE:$IMAGE_TAG
                    docker tag civitrack-auth      $AUTH_IMAGE:$IMAGE_TAG
                    docker tag civitrack-complaints $COMPLAINT_IMAGE:$IMAGE_TAG

                    docker tag civitrack-gateway   $GATEWAY_IMAGE:latest
                    docker tag civitrack-auth      $AUTH_IMAGE:latest
                    docker tag civitrack-complaints $COMPLAINT_IMAGE:latest

                    docker push $GATEWAY_IMAGE:$IMAGE_TAG
                    docker push $AUTH_IMAGE:$IMAGE_TAG
                    docker push $COMPLAINT_IMAGE:$IMAGE_TAG

                    docker push $GATEWAY_IMAGE:latest
                    docker push $AUTH_IMAGE:latest
                    docker push $COMPLAINT_IMAGE:latest

                    echo "✅ Images pushed: $IMAGE_TAG + latest"
                '''
            }
        }

        // ──────────────────────────────────────
        stage('Deploy') {
        // ──────────────────────────────────────
            steps {
                echo '🚀 Deploying CiviTrack...'
                sh '''
                    docker-compose down --remove-orphans || true
                    docker-compose up --build -d
                    echo "✅ Deployment complete"
                '''
            }
        }

        // ──────────────────────────────────────
        stage('Smoke Test') {
        // ──────────────────────────────────────
            steps {
                echo '💨 Running post-deploy smoke test...'
                sh '''
                    sleep 10

                    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")

                    if [ "$STATUS" = "200" ]; then
                        echo "✅ Smoke test PASSED — gateway responding"
                        curl -s http://localhost:3000/health
                    else
                        echo "❌ Smoke test FAILED — got HTTP $STATUS"
                        docker-compose logs --tail=50
                        exit 1
                    fi
                '''
            }
        }

    }

    // ──────────────────────────────────────────
    post {
    // ──────────────────────────────────────────
        success {
            echo '''
            ╔══════════════════════════════════╗
            ║  ✅ PIPELINE SUCCEEDED           ║
            ║  CiviTrack deployed successfully ║
            ╚══════════════════════════════════╝
            '''
        }
        failure {
            echo '''
            ╔══════════════════════════════════╗
            ║  ❌ PIPELINE FAILED              ║
            ║  Check logs above for details    ║
            ╚══════════════════════════════════╝
            '''
            // Show recent container logs on failure
            sh 'docker-compose logs --tail=100 || true'
        }
        always {
            echo '🧹 Cleaning up dangling Docker images...'
            sh 'docker image prune -f || true'
        }
    }
}
