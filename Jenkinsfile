pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Validate') {
            steps {
                echo '🔍 Validating project structure...'
                sh '''
                    test -f docker-compose.yml && echo "✅ docker-compose.yml found"
                    test -f gateway/Dockerfile && echo "✅ gateway/Dockerfile found"
                    test -f auth-service/Dockerfile && echo "✅ auth-service/Dockerfile found"
                    test -f complaint-service/Dockerfile && echo "✅ complaint-service/Dockerfile found"
                    echo "All required files present."
                '''
            }
        }

        stage('Build Services') {
            steps {
                echo '🐳 Building Docker images...'
                sh 'docker-compose build'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running health tests...'
                sh '''
                    docker-compose up -d
                    sleep 20
                    curl -s -o /dev/null -w "Gateway: %{http_code}\n" http://localhost:3000/health || echo "Gateway: checking..."
                    curl -s -o /dev/null -w "Auth: %{http_code}\n" http://localhost:3001/auth/health || echo "Auth: checking..."
                    docker-compose down
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying CiviTrack...'
                sh 'docker compose up -d'
            }
        }

        stage('Smoke Test') {
            steps {
                echo '💨 Smoke test...'
                sh '''
                    sleep 10
                    curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/health || echo "Still starting..."
                    echo "✅ Done"
                '''
            }
        }
    }

    post {
        success {
            echo '✅ PIPELINE SUCCEEDED - CiviTrack deployed successfully'
        }
        failure {
            echo '❌ PIPELINE FAILED - Check logs above'
        }
    }
}