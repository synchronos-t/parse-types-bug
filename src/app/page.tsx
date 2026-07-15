'use client';

import { useState } from 'react';
import type ParseType from 'parse';
import styles from './page.module.css';

type ItemRow = {
  objectId: string;
  title: string;
  areaIds: string[];
};

const APP_ID = 'dev';
const JS_KEY = 'dev-js-key';
const SERVER_URL = 'http://localhost:1337/parse';

const sampleRows = [
  { title: 'matches-a1', areaIds: ['A1', 'B3'] },
  { title: 'matches-a2', areaIds: ['A2'] },
  { title: 'no-match', areaIds: ['B3', 'C4'] },
];

let parseClient: typeof ParseType | null = null;

async function getParse(): Promise<typeof ParseType> {
  if (parseClient) {
    return parseClient;
  }

  const { default: Parse } = await import('parse');

  if (!Parse.applicationId) {
    Parse.initialize(APP_ID, JS_KEY);
    Parse.serverURL = SERVER_URL;
  }

  parseClient = Parse;
  return Parse;
}

function toRows(items: Array<{ id?: string; get: (key: string) => unknown }>): ItemRow[] {
  return items.flatMap((item) => {
    if (!item.id) {
      return [];
    }

    return [
      {
        objectId: item.id,
        title: item.get('title') as string,
        areaIds: (item.get('areaIds') as string[]) ?? [],
      },
    ];
  });
}

async function clearItems(): Promise<number> {
  const Parse = await getParse();
  const query = new Parse.Query('Item');
  query.limit(1000);
  const items = await query.find();

  if (items.length > 0) {
    await Parse.Object.destroyAll(items);
  }

  return items.length;
}

async function seedItems(): Promise<void> {
  const Parse = await getParse();
  const Item = Parse.Object.extend('Item');
  const objects = sampleRows.map(({ title, areaIds }) => {
    const item = new Item();
    item.set('title', title);
    item.set('areaIds', areaIds);
    return item;
  });

  await Parse.Object.saveAll(objects);
}

async function loadAllItems(): Promise<ItemRow[]> {
  const Parse = await getParse();
  const query = new Parse.Query('Item');
  query.ascending('title');
  query.limit(1000);
  const results = await query.find();
  return toRows(results);
}

export default function Home() {
  const [databaseRows, setDatabaseRows] = useState<ItemRow[]>([]);
  const [queryRows, setQueryRows] = useState<ItemRow[]>([]);
  const [status, setStatus] = useState('Ready.');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  const onSeed = () =>
    run(async () => {
      await clearItems();
      await seedItems();
      setDatabaseRows(await loadAllItems());
      setStatus('Seeded 3 Item rows.');
      setQueryRows([]);
    });

  const onLoadAll = () =>
    run(async () => {
      const results = await loadAllItems();
      setDatabaseRows(results);
      setStatus(`Loaded ${results.length} rows from the database.`);
    });

  const onQuery = () =>
    run(async () => {
      const Parse = await getParse();
      const query = new Parse.Query('Item');
      query.containedIn('areaIds', ['A1', 'A2']);
      query.ascending('title');
      const results = await query.find();
      setQueryRows(toRows(results));
      setStatus(`Query returned ${results.length} rows.`);
    });

  const onClear = () =>
    run(async () => {
      const deleted = await clearItems();
      setDatabaseRows([]);
      setQueryRows([]);
      setStatus(`Cleared ${deleted} rows.`);
    });

  return (
    <main className={styles.main}>
      <h1>Parse containedIn typing bug repro</h1>
      <p>
        This page demonstrates runtime overlap behavior when querying an array field with{' '}
        <code>{"containedIn('areaIds', ['A1', 'A2'])"}</code>.
      </p>
      <p>
        Expected matches after seeding: <strong>matches-a1</strong> and{' '}
        <strong>matches-a2</strong>. <strong>no-match</strong> should be excluded.
      </p>

      <div className={styles.actions}>
        <button onClick={onSeed} disabled={busy}>
          Seed sample data
        </button>
        <button onClick={onLoadAll} disabled={busy}>
          Load all rows
        </button>
        <button onClick={onQuery} disabled={busy}>
          Run overlap query
        </button>
        <button onClick={onClear} disabled={busy}>
          Clear sample data
        </button>
      </div>

      <p className={styles.status}>{status}</p>

      <section className={styles.section}>
        <h2>Current Database Contents</h2>
        {databaseRows.length === 0 ? (
          <p>No rows loaded.</p>
        ) : (
          <ul>
            {databaseRows.map((row) => (
              <li key={row.objectId}>
                <code>{row.title}</code> — areaIds: [{row.areaIds.join(', ')}]
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Query Results</h2>
        {queryRows.length === 0 ? (
          <p>No rows loaded.</p>
        ) : (
          <ul>
            {queryRows.map((row) => (
              <li key={row.objectId}>
                <code>{row.title}</code> — areaIds: [{row.areaIds.join(', ')}]
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
