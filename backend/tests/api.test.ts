import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index';
import { prisma } from '../src/db/prisma';
import http from 'node:http';

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let publisherToken: string;

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 5000;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Log in as Admin
  const adminRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zeeshan@gmail.com', password: 'password123' }),
  });
  const adminData = await adminRes.json();
  adminToken = adminData.token;

  // Log in as Publisher Farhan
  const pubRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farhan@gmail.com', password: 'password123' }),
  });
  const pubData = await pubRes.json();
  publisherToken = pubData.token;
});

test.after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  await prisma.$disconnect();
});

test('Gate 1: Publisher Creation Simplification ([01:53])', async () => {
  // Test missing field validation
  const invalidRes = await fetch(`${baseUrl}/api/v1/publishers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ name: '' }),
  });
  assert.equal(invalidRes.status, 400);
  const invalidData = await invalidRes.json();
  assert.match(invalidData.message, /Please fill out this field|valid email/i);

  // Test successful creation with ONLY name, email, password
  const uniqueEmail = `test.pub.${Date.now()}@example.com`;
  const validRes = await fetch(`${baseUrl}/api/v1/publishers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Test Streamlined Publisher',
      email: uniqueEmail,
      password: 'securepassword123',
    }),
  });
  assert.equal(validRes.status, 201);
  const created = await validRes.json();
  assert.equal(created.name, 'Test Streamlined Publisher');
  assert.equal(created.email, uniqueEmail);
  assert.equal(created.status, 'ACTIVE');
});

test('Gate 2: Publisher Deactivation Cascade ([02:20])', async () => {
  // Create publisher
  const email = `cascade.test.${Date.now()}@example.com`;
  const pub = await prisma.user.create({
    data: {
      name: 'Cascade Target',
      email,
      passwordHash: 'dummy',
      role: 'PUBLISHER',
      status: 'ACTIVE',
    },
  });

  const offer = await prisma.offer.findFirst({ where: { status: 'ACTIVE' } });
  assert.ok(offer);

  // Assign publisher to offer
  await prisma.offerPublisher.create({
    data: {
      offerId: offer.id,
      publisherId: pub.id,
      isEnabled: true,
      approvalStatus: 'APPROVED',
    },
  });

  // Verify assignment exists
  const initialAssignment = await prisma.offerPublisher.findFirst({
    where: { offerId: offer.id, publisherId: pub.id },
  });
  assert.ok(initialAssignment);

  // Deactivate publisher via PATCH /status
  const patchRes = await fetch(`${baseUrl}/api/v1/publishers/${pub.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'INACTIVE' }),
  });
  assert.equal(patchRes.status, 200);

  // Verify assignment was automatically unassigned
  const revokedAssignment = await prisma.offerPublisher.findFirst({
    where: { offerId: offer.id, publisherId: pub.id },
  });
  assert.equal(revokedAssignment, null, 'Assignments must be wiped upon setting status to INACTIVE');

  // Verify click redirect is blocked for inactive publisher
  const clickRes = await fetch(`${baseUrl}/click?offer_id=${offer.id}&aff_id=${pub.id}&json=1`);
  assert.equal(clickRes.status, 403);
});

test('Gate 3: Network Free-Text Contact Details ([03:06])', async () => {
  const netRes = await fetch(`${baseUrl}/api/v1/networks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Nutra Network ${Date.now()}`,
      contactDetails: 'Telegram: @my_affiliate_lead, Skype: nutra_deals',
      allowDuplicateConversions: true,
    }),
  });
  assert.equal(netRes.status, 201);
  const data = await netRes.json();
  assert.equal(data.contactDetails, 'Telegram: @my_affiliate_lead, Skype: nutra_deals');
  assert.equal(data.allowDuplicateConversions, true);
});

test('Gate 4: Offer Visibility State Machine ([04:08])', async () => {
  const network = await prisma.network.findFirst();
  assert.ok(network);

  const pub1 = await prisma.user.findFirst({ where: { role: 'PUBLISHER', status: 'ACTIVE' } });
  assert.ok(pub1);

  // Create Private Offer with enabled publisher
  const offerRes = await fetch(`${baseUrl}/api/v1/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      general: {
        name: `Visibility Test Offer ${Date.now()}`,
        networkId: network.id,
        visibility: 'PRIVATE',
        status: 'ACTIVE',
      },
      tracking: {
        destinationUrl: 'https://brand.com/landing?clickid={clickid}',
      },
      targeting: {
        devices: ['ALL'],
        countries: ['ALL'],
      },
      affiliates: {
        enabledPublisherIds: [pub1.id],
      },
      revenuePayouts: {
        revenue: 150,
        payout: 100,
      },
    }),
  });
  assert.equal(offerRes.status, 201);
  const offer = await offerRes.json();

  // Verify publisher is assigned
  const assignCheck = await prisma.offerPublisher.findFirst({
    where: { offerId: offer.id, publisherId: pub1.id },
  });
  assert.ok(assignCheck);

  // Update offer to PUBLIC -> verify assignment list is cleared
  const updateRes = await fetch(`${baseUrl}/api/v1/offers/${offer.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      general: {
        name: offer.name,
        networkId: network.id,
        visibility: 'PUBLIC',
        status: 'ACTIVE',
      },
      tracking: {
        destinationUrl: 'https://brand.com/landing?clickid={clickid}',
      },
      targeting: {
        devices: ['ALL'],
        countries: ['ALL'],
      },
      affiliates: {
        enabledPublisherIds: [],
      },
      revenuePayouts: {
        revenue: 150,
        payout: 100,
      },
    }),
  });
  assert.equal(updateRes.status, 200);

  const clearedCheck = await prisma.offerPublisher.findFirst({
    where: { offerId: offer.id },
  });
  assert.equal(clearedCheck, null, 'Public offers clear the private enabled affiliates list');
});

test('Gate 5: Macro Replacement & S2S Postback ([04:40], [06:24])', async () => {
  const farhan = await prisma.user.findFirst({ where: { email: 'farhan@gmail.com' } });
  const luovia = await prisma.offer.findFirst({ where: { name: 'Luovia - OA' } });
  assert.ok(farhan && luovia);

  // 1. Click redirect with json=1 inspection
  const clickRes = await fetch(`${baseUrl}/click?offer_id=${luovia.id}&aff_id=${farhan.id}&sub_id=sub_camp_99&json=1`);
  assert.equal(clickRes.status, 200);
  const clickData = await clickRes.json();

  assert.ok(clickData.clickId, 'Click ID must be generated');
  assert.match(clickData.resolvedUrl, new RegExp(clickData.clickId));
  assert.match(clickData.resolvedUrl, new RegExp(`aff_id=${farhan.id}`));
  assert.match(clickData.resolvedUrl, /sub_camp_99/);

  // 2. Fire Postback for this click ID
  const postbackRes = await fetch(`${baseUrl}/postback?clickid=${clickData.clickId}&goal=1`);
  assert.equal(postbackRes.status, 200);
  const postbackData = await postbackRes.json();

  assert.equal(postbackData.success, true);
  assert.equal(postbackData.payout, 150.0);
  assert.equal(postbackData.revenue, 225.0);

  // 3. Test duplicate conversion restriction
  const duplicateRes = await fetch(`${baseUrl}/postback?clickid=${clickData.clickId}&goal=1`);
  assert.equal(duplicateRes.status, 409, 'Duplicate postback must be rejected when allowDuplicateConversions is false');
});

test('Gate 6: Dashboard & Report Calculations ([00:13], [07:35])', async () => {
  const dashRes = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();

  assert.ok(dashData.kpis.clicks.total >= 68);
  assert.ok(dashData.kpis.conversions.total >= 5);
  assert.equal(dashData.kpis.payout.currency, 'USD');
  assert.ok(dashData.kpis.epc.total > 0);

  // Verify top performers sorting
  if (dashData.topOffers.length > 1) {
    const first = dashData.topOffers[0];
    const second = dashData.topOffers[1];
    assert.ok(
      first.conversions > second.conversions ||
      (first.conversions === second.conversions && first.clicks >= second.clicks),
      'Top offers must be sorted by conversions DESC, clicks DESC'
    );
  }

  // Verify Report summary calculations
  const reportRes = await fetch(`${baseUrl}/api/v1/reports/networks`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(reportRes.status, 200);
  const reportData = await reportRes.json();
  assert.ok(Array.isArray(reportData.rows));
  assert.ok(reportData.summary.totalConversions >= 5);
});

test('Gate 7: Role-Based Serializer Stripping ([07:12])', async () => {
  const pubDashRes = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
    headers: { Authorization: `Bearer ${publisherToken}` },
  });
  assert.equal(pubDashRes.status, 200);
  const pubDashData = await pubDashRes.json();

  // Publisher must NEVER see revenue or profit
  assert.equal(pubDashData.kpis.revenue, undefined, 'revenue must be stripped for publisher');
  assert.equal(pubDashData.trafficLast30Days[0]?.totalProfit, undefined, 'totalProfit must be stripped for publisher');
  assert.equal(pubDashData.trafficLast30Days[0]?.totalIncome, undefined, 'totalIncome must be stripped for publisher');
  assert.ok(pubDashData.kpis.payout.total >= 0, 'Publisher sees payout');
});
