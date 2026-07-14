import cors from 'cors';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ParseServer from 'parse-server';

const PARSE_PORT = 1337;
const PARSE_PATH = '/parse';
const PARSE_SERVER_URL = `http://localhost:${PARSE_PORT}${PARSE_PATH}`;

let mongoServer: MongoMemoryServer | undefined;

async function start() {
  mongoServer = await MongoMemoryServer.create();

  const parseServer = new ParseServer({
    databaseURI: mongoServer.getUri('parse-types-bug'),
    appId: 'dev',
    masterKey: 'dev-master-key',
    maintenanceKey: 'dev-maintenance-key',
    javascriptKey: 'dev-js-key',
    serverURL: PARSE_SERVER_URL,
    allowClientClassCreation: true,
  });

  await parseServer.start();

  const app = express();
  app.use(
    cors({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Parse-Application-Id', 'X-Parse-Javascript-Key'],
    }),
  );

  app.use(PARSE_PATH, parseServer.app);

  const httpServer = app.listen(PARSE_PORT, () => {
    console.log(`Parse Server listening at ${PARSE_SERVER_URL}`);
  });

  const shutdown = async () => {
    httpServer.close();
    await parseServer.handleShutdown();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error(error);
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(1);
});
