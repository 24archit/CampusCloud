const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const useLocal = process.env.LOCAL_DEV === 'true' || (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_LAMBDA_FUNCTION_NAME);
let localDB = null;
if (useLocal) {
  localDB = require('./local-db');
}

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Get a single item by primary key.
 */
const get = (TableName, Key) => {
  if (useLocal) return localDB.get(TableName, Key);
  return docClient.send(new GetCommand({ TableName, Key }));
};

/**
 * Put (create / overwrite) an item.
 */
const put = (TableName, Item) => {
  if (useLocal) return localDB.put(TableName, Item);
  return docClient.send(new PutCommand({ TableName, Item }));
};

/**
 * Update an item and return the new image.
 */
const update = (
  TableName,
  Key,
  UpdateExpression,
  ExpressionAttributeNames,
  ExpressionAttributeValues,
) => {
  if (useLocal) return localDB.update(TableName, Key, UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues);
  return docClient.send(
    new UpdateCommand({
      TableName,
      Key,
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }),
  );
};

/**
 * Delete an item by primary key.
 */
const deleteItem = (TableName, Key) => {
  if (useLocal) return localDB.delete(TableName, Key);
  return docClient.send(new DeleteCommand({ TableName, Key }));
};

/**
 * Query items using a key condition.
 */
const query = (params) => {
  if (useLocal) return localDB.query(params);
  return docClient.send(new QueryCommand(params));
};

/**
 * Scan an entire table (use sparingly; suitable for small tables).
 */
const scan = (params) => {
  if (useLocal) return localDB.scan(params);
  return docClient.send(new ScanCommand(params));
};

module.exports = { get, put, update, delete: deleteItem, query, scan };
