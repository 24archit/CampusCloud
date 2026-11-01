'use strict';

const fs = require('fs');
const path = require('path');
const { hashPassword } = require('../utils/helpers');

const DATA_DIR = path.join(__dirname, '../../local-dev/data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(tableName) {
  const safeName = tableName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safeName}.json`);
}

function loadTable(tableName) {
  const file = getFilePath(tableName);
  if (!fs.existsSync(file)) {
    // Seed initial data if applicable
    const initial = seedData(tableName);
    saveTable(tableName, initial);
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function saveTable(tableName, items) {
  const file = getFilePath(tableName);
  fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf8');
}

function seedData(tableName) {
  const name = tableName.toLowerCase();
  const now = new Date().toISOString();

  if (name.includes('user')) {
    return [
      {
        userId: 'admin-001',
        name: 'Campus Administrator',
        email: 'admin@campuscloud.edu',
        passwordHash: hashPassword('Admin123!'),
        role: 'admin',
        bio: 'Lead System Administrator for CampusCloud Platform',
        uploadCount: 2,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
      {
        userId: 'student-001',
        name: 'Alex Johnson',
        email: 'alex@campuscloud.edu',
        passwordHash: hashPassword('Student123!'),
        role: 'student',
        bio: 'Computer Science & Engineering, 6th Semester',
        uploadCount: 3,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
    ];
  }

  if (name.includes('resource')) {
    return [
      {
        resourceId: 'res-001',
        title: 'Cloud Computing Architecture & AWS Services Complete Notes',
        description: 'Comprehensive study guide covering IaaS, PaaS, SaaS, AWS Lambda, API Gateway, DynamoDB, S3, and CloudFront.',
        subject: 'Cloud Computing',
        category: 'Notes',
        tags: ['AWS', 'Serverless', 'DynamoDB', 'Cloud Architecture'],
        s3Key: 'resources/student-001/res-001-cloud-computing-notes.pdf',
        fileName: 'cloud-computing-notes.pdf',
        fileType: 'application/pdf',
        fileSize: 2450000,
        uploaderId: 'student-001',
        uploaderName: 'Alex Johnson',
        uploaderEmail: 'alex@campuscloud.edu',
        downloadCount: 42,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        resourceId: 'res-002',
        title: 'Distributed Systems & Microservices Lab Manual',
        description: 'Lab experiments on RPC, message passing, consensus algorithms (Raft/Paxos), and Docker containers.',
        subject: 'Distributed Systems',
        category: 'Lab Manuals',
        tags: ['Distributed Systems', 'Lab', 'Microservices'],
        s3Key: 'resources/student-001/res-002-distributed-systems-lab.pdf',
        fileName: 'distributed-systems-lab.pdf',
        fileType: 'application/pdf',
        fileSize: 3100000,
        uploaderId: 'student-001',
        uploaderName: 'Alex Johnson',
        uploaderEmail: 'alex@campuscloud.edu',
        downloadCount: 19,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        resourceId: 'res-003',
        title: 'Advanced Computer Networks - 2025 Mid-Sem & End-Sem Solved Papers',
        description: 'Previous year question papers with model answers, covering TCP/IP, BGP routing, SDN, and Network Security.',
        subject: 'Computer Networks',
        category: 'Previous Year Papers',
        tags: ['Computer Networks', 'PYQ', 'Exams', 'Routing'],
        s3Key: 'resources/admin-001/res-003-computer-networks-pyq.pdf',
        fileName: 'computer-networks-pyq.pdf',
        fileType: 'application/pdf',
        fileSize: 1850000,
        uploaderId: 'admin-001',
        uploaderName: 'Campus Administrator',
        uploaderEmail: 'admin@campuscloud.edu',
        downloadCount: 67,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  if (name.includes('share')) {
    return [];
  }

  return [];
}

const localDB = {
  get: async (tableName, key) => {
    const items = loadTable(tableName);
    const keyProps = Object.keys(key);
    const found = items.find((item) => keyProps.every((k) => item[k] === key[k]));
    return { Item: found ? { ...found } : undefined };
  },

  put: async (tableName, item) => {
    const items = loadTable(tableName);
    let keyProp = 'id';
    if ('userId' in item) keyProp = 'userId';
    else if ('resourceId' in item) keyProp = 'resourceId';
    else if ('shareId' in item) keyProp = 'shareId';

    const index = items.findIndex((i) => i[keyProp] === item[keyProp]);
    if (index >= 0) {
      items[index] = { ...item };
    } else {
      items.push({ ...item });
    }
    saveTable(tableName, items);
    return {};
  },

  update: async (tableName, key, updateExpression, attributeNames = {}, attributeValues = {}) => {
    const items = loadTable(tableName);
    const keyProps = Object.keys(key);
    const item = items.find((i) => keyProps.every((k) => i[k] === key[k]));
    if (!item) {
      throw new Error(`Item not found in ${tableName}`);
    }

    const cleaned = updateExpression.replace(/^SET\s+/i, '');
    // Split assignments by comma NOT enclosed in parentheses
    const assignments = cleaned.split(/,(?![^(]*\))/).map((s) => s.trim());

    for (const assignment of assignments) {
      if (!assignment || !assignment.includes('=')) continue;
      const eqIdx = assignment.indexOf('=');
      const lhs = assignment.slice(0, eqIdx).trim();
      const rhs = assignment.slice(eqIdx + 1).trim();

      const field = attributeNames[lhs] || lhs;

      if (rhs.includes('+')) {
        item[field] = (Number(item[field]) || 0) + 1;
      } else if (rhs.includes('-')) {
        item[field] = Math.max(0, (Number(item[field]) || 0) - 1);
      } else {
        const val = attributeValues[rhs];
        item[field] = val !== undefined ? val : rhs;
      }
    }

    saveTable(tableName, items);
    return { Attributes: { ...item } };
  },

  delete: async (tableName, key) => {
    const items = loadTable(tableName);
    const keyProps = Object.keys(key);
    const filtered = items.filter((i) => !keyProps.every((k) => i[k] === key[k]));
    saveTable(tableName, filtered);
    return {};
  },

  scan: async (params) => {
    const { TableName, FilterExpression, ExpressionAttributeNames = {}, ExpressionAttributeValues = {} } = params;
    let items = loadTable(TableName);

    if (FilterExpression) {
      // Evaluate common expressions used in this codebase
      items = items.filter((item) => {
        // Check email = :email
        if (FilterExpression.includes('email = :email')) {
          const target = (ExpressionAttributeValues[':email'] || '').toLowerCase();
          return (item.email || '').toLowerCase() === target;
        }

        // Check #del = :false
        const isDelName = ExpressionAttributeNames['#del'] || 'isDeleted';
        if (FilterExpression.includes('#del = :false') || FilterExpression.includes('isDeleted = :false')) {
          if (item[isDelName] === true) return false;
        }

        // Check #uid = :uid
        const uidName = ExpressionAttributeNames['#uid'] || 'uploaderId';
        if (FilterExpression.includes('#uid = :uid')) {
          const targetUid = ExpressionAttributeValues[':uid'];
          if (item[uidName] !== targetUid) return false;
        }

        return true;
      });
    }

    return { Items: items.map((i) => ({ ...i })) };
  },

  query: async (params) => {
    return localDB.scan(params);
  },
};

module.exports = localDB;
