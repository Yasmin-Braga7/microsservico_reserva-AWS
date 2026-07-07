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

    // Correção: listSecrets() retorna um objeto { secrets: [...] }, não a lista direto.
    // Faltava desestruturar, por isso o for...of quebrava com "secrets is not iterable".
    const secretPath = process.env.INFISICAL_SECRET_PATH || '/';
    const { secrets } = await client.secrets().listSecrets({
      projectId,
      environment,
      secretPath
    });

    for (const secret of secrets) {
      process.env[secret.secretKey] = secret.secretValue;
    }
    console.log(`[Infisical] ${secrets.length} segredo(s) carregado(s) com sucesso no process.env.`);
  } catch (error) {
    console.error('[Infisical] Erro ao carregar segredos do Infisical:', error.message);
    throw error;
  }
}

module.exports = { loadSecrets };
