pipeline {
    agent any

    // 1. Variáveis Globais de Ambiente
    environment {
        APP_NAME  = 'biblioteca-reserva'
        IMAGE_TAG = "${APP_NAME}:${env.BUILD_ID}"
    }

    stages {
        stage('Verificar Repositório') {
            steps {
                // 2. Sintaxe Git simplificada
                git branch: 'main', url: 'https://github.com/Gugzz21/microsservico_reserva'
            }
        }

        stage('Instalar Dependências') {
            steps {
                // Nota: Verifique a seção de Dicas Arquiteturais abaixo sobre esta etapa
                bat 'npm install'
                bat 'npx prisma generate'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                // 3. Uso direto das variáveis de ambiente sem a necessidade do bloco 'script'
                bat "docker build -t ${IMAGE_TAG} ."
            }
        }

        stage('Fazer Deploy') {
            steps {
                // 4. Parar e remover o container antigo de forma segura
                bat returnStatus: true, script: "docker rm -f ${APP_NAME}"
                
                // 5. Iniciar o novo container
                bat "docker run -d --name ${APP_NAME} -p 9503:9503 ${IMAGE_TAG}"
            }
        }
    }

    post {
        success {
            echo "Deploy do ${APP_NAME} realizado com sucesso!"
        }
        failure {
            echo "Houve um erro durante o deploy do ${APP_NAME}."
        }
    }
}