pipeline {
    agent any

    stages {
        stage('Verificar Repositório') {
            steps {
                
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']], 
                    doGenerateSubmoduleConfigurations: false, 
                    extensions: [], 
                    submoduleCfg: [], 
                    userRemoteConfigs: [[url: 'https://github.com/Gugzz21/microsservico_reserva']]
                ])
            }
        }

        stage('Instalar Dependências') {
            steps {

                bat 'npm install'
                bat 'npx prisma generate'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                script {
                    
                    def appName = 'micro-reserva'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    bat "docker build -t ${imageTag} ."
                }
            }
        }

        stage('Fazer Deploy') {
            steps {
                script {
                    def appName = 'micro-reserva'
                    def imageTag = "${appName}:${env.BUILD_ID}"

                    bat "docker stop ${appName} || echo 0"
                    bat "docker rm -v ${appName} || echo 0"
                
                    bat "docker run -d --name ${appName} -p 9503:9503 ${imageTag}"
                }
            }
        }
    }

    post {
        success {
            echo 'Deploy do micro-reserva realizado com sucesso!'
        }
        failure {
            echo 'Houve um erro durante o deploy do micro-reserva.'
        }
    }
}