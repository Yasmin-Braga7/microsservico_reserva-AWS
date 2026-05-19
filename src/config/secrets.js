const { InfisicalSDK } = require("@infisical/sdk");

const client = new InfisicalSDK({
    siteUrl: process.env.INFISICAL_API_URL || "https://app.infisical.com"
});

async function loadSecrets() {
    try {
        console.log('[Infisical] Authenticating...');
        // Autenticação usando Machine Identity
        await client.auth().universalAuth.login({
            clientId: process.env.INFISICAL_CLIENT_ID,
            clientSecret: process.env.INFISICAL_CLIENT_SECRET
        });

        console.log('[Infisical] Fetching secrets...');
        // Buscar todas as variáveis do ambiente do Infisical
        const secrets = await client.secrets().listSecrets({
            environment: process.env.INFISICAL_ENV || "dev",
            projectId: process.env.INFISICAL_PROJECT_ID,
            secretPath: "/",
            expandSecretReferences: true,
            viewSecretValue: true
        });

        // Injetar no process.env
        secrets.forEach(secret => {
            if (secret.secretKey && secret.secretValue) {
                process.env[secret.secretKey] = secret.secretValue;
            }
        });

        console.log('[Infisical] Secrets loaded successfully');
    } catch (error) {
        console.error('[Infisical] Error loading secrets:', error.message);
        throw error;
    }
}

module.exports = { loadSecrets };
