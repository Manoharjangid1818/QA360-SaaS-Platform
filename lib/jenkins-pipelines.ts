/**
 * Jenkins Pipeline Configuration Examples
 * 
 * These are examples of how to configure Jenkins pipelines for various test execution scenarios.
 * Copy and adapt these configurations for your Jenkins instance.
 */

// ============================================================================
// EXAMPLE 1: Smoke Test Pipeline
// ============================================================================
const SMOKE_PIPELINE = `
pipeline {
    agent any
    
    parameters {
        string(name: 'TEST_URL', defaultValue: 'http://localhost:3000', description: 'URL to test')
    }
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-org/qa360-saas-platform.git'
            }
        }
        
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install'
            }
        }
        
        stage('Run Smoke Tests') {
            steps {
                sh 'npm run test:smoke'
            }
        }
        
        stage('Generate Report') {
            steps {
                sh 'npx allure generate allure-results --clean -o allure-report'
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true
        }
        success {
            script {
                sh '''
                    curl -X POST -H 'Content-type: application/json' \\
                    --data '{"text":"✅ Smoke tests passed! Build is healthy."}' \\
                    \${SLACK_WEBHOOK}
                '''
            }
        }
        failure {
            script {
                sh '''
                    curl -X POST -H 'Content-type: application/json' \\
                    --data '{"text":"❌ Smoke tests failed! Check report: \${BUILD_URL}artifact/allure-report/"}' \\
                    \${SLACK_WEBHOOK}
                '''
            }
        }
    }
}
`;

// ============================================================================
// EXAMPLE 2: Regression Test Pipeline
// ============================================================================
const REGRESSION_PIPELINE = `
pipeline {
    agent any
    
    options {
        timeout(time: 2, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-org/qa360-saas-platform.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install'
            }
        }
        
        stage('Run Regression Tests') {
            parallel {
                stage('UI Tests') {
                    steps {
                        sh 'npm run test:regression -- --grep @ui'
                    }
                }
                stage('API Tests') {
                    steps {
                        sh 'npm run test:regression -- --grep @api'
                    }
                }
            }
        }
        
        stage('Generate Allure Report') {
            steps {
                sh 'npx allure generate allure-results --clean -o allure-report'
            }
        }
    }
    
    post {
        always {
            junit 'test-results/junit.xml'
            archiveArtifacts artifacts: 'playwright-report/**,allure-report/**', allowEmptyArchive: true
        }
    }
}
`;

// ============================================================================
// EXAMPLE 3: API Test Pipeline
// ============================================================================
const API_PIPELINE = `
pipeline {
    agent any
    
    environment {
        API_URL = credentials('api-url')
        API_TOKEN = credentials('api-token')
    }
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-org/qa360-saas-platform.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install'
            }
        }
        
        stage('Run API Tests') {
            steps {
                sh 'npm run test:api'
            }
        }
        
        stage('Generate Report') {
            steps {
                sh 'npx allure generate allure-results --clean -o allure-report'
                publishHTML([
                    reportDir: 'allure-report',
                    reportFiles: 'index.html',
                    reportName: 'Allure Report'
                ])
            }
        }
    }
    
    post {
        always {
            junit 'test-results/junit.xml'
        }
        failure {
            emailext(
                subject: 'API Tests Failed',
                body: 'API tests have failed. Check the report: \${BUILD_URL}',
                to: '\${TEST_TEAM_EMAIL}'
            )
        }
    }
}
`;

// ============================================================================
// EXAMPLE 4: Docker-based Pipeline
// ============================================================================
const DOCKER_PIPELINE = `
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-org/qa360-saas-platform.git'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t qa360-framework:latest .'
                    sh 'docker tag qa360-framework:latest qa360-framework:\${BUILD_NUMBER}'
                }
            }
        }
        
        stage('Run Tests in Docker') {
            steps {
                script {
                    sh '''
                        docker run --rm \\
                            -e TEST_URL=http://localhost:3000 \\
                            -v \$(pwd)/playwright-report:/app/playwright-report \\
                            -v \$(pwd)/allure-report:/app/allure-report \\
                            qa360-framework:latest
                    '''
                }
            }
        }
        
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'playwright-report/**,allure-report/**', allowEmptyArchive: true
            }
        }
    }
    
    post {
        always {
            sh 'docker logs qa360-framework:latest || true'
        }
    }
}
`;

// ============================================================================
// EXAMPLE 5: Critical Tests Pipeline (Pre-deployment)
// ============================================================================
const CRITICAL_PIPELINE = `
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-org/qa360-saas-platform.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Run Critical Tests Only') {
            steps {
                sh 'npm run test:critical'
            }
        }
    }
    
    post {
        always {
            junit 'test-results/junit.xml'
        }
        failure {
            error "Critical tests failed! Blocking deployment."
        }
    }
}
`;

export {
  SMOKE_PIPELINE,
  REGRESSION_PIPELINE,
  API_PIPELINE,
  DOCKER_PIPELINE,
  CRITICAL_PIPELINE,
};
