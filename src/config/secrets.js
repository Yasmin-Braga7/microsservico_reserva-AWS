const { InfisicalSDK } = require('@infisical/sdk');

async function loadSecrets() {
  const clientId = process.env.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENV || 'dev';
  const siteUrl = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';

  if (!clientId || !clientSecret) {
    console.warn('[Infisical] Credenciais ausentes (INFISICAL_CLIENT_ID/INFISICAL_CLIENT_SECRET). Pulando carregamento de segredos.');
    return;
  }

  if (!projectId) {
    console.warn('[Infisical] INFISICAL_PROJECT_ID não fornecido. Pulando carregamento de segredos.');
    return;
  }

  try {
    console.log('[Infisical] Autenticando no Infisical...');
    const client = new InfisicalSDK({ siteUrl });
    
    await client.auth().universalAuth.login({
      clientId,
      clientSecret
    });

    console.log(`[Infisical] Buscando segredos para o projeto ${projectId} no ambiente "${environment}"...`);
    const secrets = await client.secrets().listSecrets({
      projectId,
      environment
    });

    for (const secret of secrets) {
      process.env[secret.secretKey] = secret.secretValue;
    }
    console.log('[Infisical] Segredos carregados com sucesso no process.env.');
  } catch (error) {
    console.error('[Infisical] Erro ao carregar segredos do Infisical:', error.message);
    throw error;
  }
}

module.exports = { loadSecrets };
