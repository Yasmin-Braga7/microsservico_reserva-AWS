// Jenkinsfile – Windows Agent
pipeline {
    agent { label 'windows' }

    environment {
        SERVICE_NAME  = 'microsservico_reserva'
        IMAGE_NAME    = "biblioteca/${env.SERVICE_NAME}"
        IMAGE_TAG     = "${env.BUILD_NUMBER}"
        CONTAINER_PORT = '9504'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test -- --forceExit --passWithNoTests'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest ."
            }
        }

        stage('Deploy Container') {
            steps {
                // Para o container antigo (ignora erro se não existir)
                bat "docker stop %SERVICE_NAME% 2>nul || exit /b 0"
                bat "docker rm   %SERVICE_NAME% 2>nul || exit /b 0"

                // Sobe o novo container
                bat """
                    docker run -d ^
                        --name %SERVICE_NAME% ^
                        --restart unless-stopped ^
                        --network biblioteca_network ^
                        -p %CONTAINER_PORT%:%CONTAINER_PORT% ^
                        --env-file .env ^
                        %IMAGE_NAME%:%IMAGE_TAG%
                """
            }
        }

        stage('Health Check') {
            steps {
                // Aguarda o serviço responder (até 60 s)
                bat """
                    set TRIES=0
                    :loop
                    curl -sf http://localhost:%CONTAINER_PORT%/health >nul 2>&1 && goto :ok
                    set /a TRIES+=1
                    if %TRIES% GEQ 12 (echo Health check falhou & exit /b 1)
                    timeout /t 5 /nobreak >nul
                    goto :loop
                    :ok
                    echo Servico respondendo com sucesso!
                """
            }
        }
    }

    post {
        success {
            echo "Deploy do ${env.SERVICE_NAME} concluido com sucesso! (build #${env.BUILD_NUMBER})"
        }
        failure {
            echo "FALHA no pipeline do ${env.SERVICE_NAME}. Verifique os logs acima."
        }
        always {
            // Remove imagens antigas (mantém as 3 últimas)
            bat "for /f \"skip=3 tokens=*\" %%i in ('docker images %IMAGE_NAME% -q') do docker rmi %%i 2>nul || exit /b 0"
        }
    }
}
