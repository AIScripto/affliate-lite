import express, { Request, Response, NextFunction } from 'express';
import { pathToFileURL } from 'node:url';
import { config, SANDBOX_PATHS, TRACKER_PATHS, isPrivateAddress } from './config';
import { store, EventStore } from './store';
import { TrackerAdmin, trackerAdmin } from './tracker/admin';
import { sendPostback } from './tracker/traffic';
import { SCENARIOS, findScenario } from './scenarios/catalog';
import { runScenarios } from './scenarios/runner';
import { requirePassword } from './web/auth';
import { dashboardPage } from './web/dashboard';
import { landingPage, eventRows, LANDING_ACTIONS } from './web/landing';

type Handler = (req: Request, res: Response) => Promise<void> | void;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);
const first = (v: unknown) => String((Array.isArray(v) ? v[0] : v) ?? '').trim();

export interface AppDeps {
  admin?: TrackerAdmin;
  events?: EventStore;
  password?: string;
}

export function createApp(deps: AppDeps = {}) {
  const admin = deps.admin ?? trackerAdmin;
  const events = deps.events ?? store;
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // ---------- public: health and the fake publisher (the tracker calls these) ----------
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'affiliate-sandbox' });
  });

  const receivePublisherPostback: Handler = (req, res) => {
    const query = Object.fromEntries(Object.entries({ ...req.query, ...(req.body ?? {}) }).map(([k, v]) => [k, first(v)]));
    const clickId = query.clickid || null;
    events.add('publisher-received', clickId, `payout ${query.payout ?? '?'} · goal ${query.goal ?? '?'} · ${query.status ?? '?'}`, { query });
    res.type('text/plain').send('OK');
  };
  app.get(SANDBOX_PATHS.publisherPostback, receivePublisherPostback);
  app.post(SANDBOX_PATHS.publisherPostback, receivePublisherPostback);

  // ---------- everything else needs the sandbox password ----------
  app.use(requirePassword(deps.password ?? config.password));

  app.get('/', (_req, res) => {
    res.type('html').send(dashboardPage());
  });

  app.get(SANDBOX_PATHS.landing, (req, res) => {
    const clickId = first(req.query.clickid).toLowerCase();
    const offerId = first(req.query.offer_id);
    const subId = first(req.query.sub_id);
    if (clickId && !req.query.action_done) events.add('landing', clickId, `Offer ${offerId || '?'} · sub ${subId || '-'}`);
    res.type('html').send(landingPage({ clickId, offerId, subId, events: events.list(50, clickId), error: first(req.query.error) || undefined }));
  });

  app.post(
    '/network/convert',
    wrap(async (req, res) => {
      const clickId = first(req.body.clickid).toLowerCase();
      const offerId = first(req.body.offer_id);
      const action = LANDING_ACTIONS[first(req.body.action)];
      const back = new URLSearchParams({ clickid: clickId, offer_id: offerId, action_done: '1' });
      if (!clickId || !action) {
        back.set('error', !clickId ? 'No click ID on this page' : 'Unknown button');
      } else {
        const fixtures = admin.cachedFixtures ?? (await admin.ensureFixtures());
        const token = Number(offerId) === fixtures.offers.token ? config.offerToken : undefined;
        await sendPostback(action.profile, { clickId, ...action.input, ...(token ? { token } : {}) });
      }
      res.redirect(303, `${SANDBOX_PATHS.landing}?${back.toString()}`);
    })
  );

  app.get('/network/events', (req, res) => {
    const clickId = first(req.query.clickid);
    res.type('html').send(eventRows(events.list(clickId ? 50 : 100, clickId || undefined)));
  });

  // ---------- JSON API for the dashboard ----------
  app.get(
    '/api/status',
    wrap(async (_req, res) => {
      const f = admin.cachedFixtures;
      const pb = `${config.trackerUrl}${TRACKER_PATHS.postback}`;
      res.json({
        trackerUrl: config.trackerUrl,
        publicUrl: config.publicUrl,
        publisherCheck: !isPrivateAddress(config.publicUrl),
        fixtures: f,
        postbackUrls: {
          basic: `${pb}?clickid={clickid}`,
          full: `${pb}?clickid={clickid}&goal={goal}&status={status}&action_id={action_id}&sum={sum}&currency={currency}`,
        },
        manualLinks: f
          ? (Object.entries(f.offers) as Array<[string, number]>).map(([kind, id]) => ({
              label: `Open tracking link: ${kind} offer`,
              url: `${config.trackerUrl}${TRACKER_PATHS.click}?offer_id=${id}&aff_id=${f.publisherId}&sub_id=sbx-manual`,
            }))
          : [],
        scenarios: SCENARIOS.map(({ id, title, description }) => ({ id, title, description })),
      });
    })
  );

  app.post(
    '/api/setup',
    wrap(async (_req, res) => {
      res.json({ fixtures: await admin.ensureFixtures() });
    })
  );

  app.post(
    '/api/cleanup',
    wrap(async (_req, res) => {
      res.json(await admin.cleanup());
    })
  );

  let running = false;
  app.post(
    '/api/run',
    wrap(async (req, res) => {
      const id = first(req.body?.id) || 'all';
      const selected = id === 'all' ? SCENARIOS : [findScenario(id)].filter((s) => s !== undefined);
      if (selected.length === 0) {
        res.status(404).json({ message: `Unknown test "${id}"` });
        return;
      }
      if (running) {
        res.status(409).json({ message: 'A test run is already in progress. Wait for it to finish.' });
        return;
      }
      running = true;
      try {
        const results = await runScenarios(selected, admin);
        res.json({ passed: results.every((r) => r.passed), results });
      } finally {
        running = false;
      }
    })
  );

  app.post('/api/events/clear', (_req, res) => {
    events.clear();
    res.json({ cleared: true });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[sandbox]', err);
    res.status(500).json({ message: err.message || 'Something went wrong' });
  });

  return app;
}

// Start only when run directly (not when imported by tests)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!config.password) console.warn('[sandbox] SANDBOX_PASSWORD is not set: the screen stays locked.');
  createApp().listen(config.port, () => {
    console.log(`[sandbox] listening on ${config.port} · tracker ${config.trackerUrl} · public ${config.publicUrl}`);
  });
}
