const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  InitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

/**
 * Create a Cognito user (admin flow — used during registration in production).
 */
const createUser = async (email, temporaryPassword) => {
  return client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS',
    }),
  );
};

/**
 * Set a permanent password for a Cognito user.
 */
const setUserPassword = async (email, password) => {
  return client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }),
  );
};

/**
 * Fetch a Cognito user by username (email).
 */
const getUser = async (email) => {
  return client.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    }),
  );
};

/**
 * Delete a Cognito user.
 */
const deleteUser = async (email) => {
  return client.send(
    new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    }),
  );
};

/**
 * Authenticate a user via USER_PASSWORD_AUTH flow.
 * Returns AuthenticationResult with tokens.
 */
const authenticateUser = async (email, password) => {
  return client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );
};

module.exports = { createUser, setUserPassword, getUser, deleteUser, authenticateUser };
