import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager();

export const getSecret = async (secretId: string) => {
  const data = await secretsManager.getSecretValue({ SecretId: secretId }).promise();
  return JSON.parse(data.SecretString || '{}');
}; 