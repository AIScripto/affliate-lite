import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from './prisma';

async function seed() {
  console.log('[Seed] Seeding database with exact demo data from client walkthrough...');

  // 1. Clean existing records in reverse dependency order
  await prisma.conversion.deleteMany();
  await prisma.click.deleteMany();
  await prisma.offerPublisher.deleteMany();
  await prisma.offerPayout.deleteMany();
  await prisma.offerTargetingGroup.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.network.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Admin and Publishers
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'adren',
      email: 'zeeshan@gmail.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const farhan = await prisma.user.create({
    data: {
      name: 'Farhan',
      email: 'farhan@gmail.com',
      passwordHash,
      role: 'PUBLISHER',
      status: 'ACTIVE',
      postbackUrl: 'https://farhan-tracker.com/postback?click_id={clickid}&payout={payout}',
    },
  });

  const zeeshanAff = await prisma.user.create({
    data: {
      name: 'Zeeshan Aff',
      email: 'zeeshan.aff@gmail.com',
      passwordHash,
      role: 'PUBLISHER',
      status: 'ACTIVE',
    },
  });

  const inactivePub = await prisma.user.create({
    data: {
      name: 'Ali (Inactive)',
      email: 'ali.inactive@gmail.com',
      passwordHash,
      role: 'PUBLISHER',
      status: 'INACTIVE',
    },
  });

  console.log(`[Seed] Created Users: Admin (${admin.email}), Publishers (${farhan.email}, ${zeeshanAff.email}, ${inactivePub.email})`);

  // 3. Seed Domains
  const defaultDomain = await prisma.domain.create({
    data: {
      name: 'zshe.panel.7tracking.com',
      status: 'ACTIVE',
      isDefault: true,
    },
  });

  const altDomain = await prisma.domain.create({
    data: {
      name: 'maxwave.trk248a.com',
      status: 'ACTIVE',
      isDefault: false,
    },
  });

  console.log(`[Seed] Created Domains: ${defaultDomain.name}, ${altDomain.name}`);

  // 4. Seed Networks (Advertisers) with free-text contactDetails per [03:06]
  const everflowNet = await prisma.network.create({
    data: {
      name: 'Everflow',
      contactDetails: 'Telegram: @everflow_rep',
      allowDuplicateConversions: true,
      status: 'ACTIVE',
    },
  });

  const mobeekaNet = await prisma.network.create({
    data: {
      name: 'Mobeeka',
      contactDetails: 'Skype: live:mobeeka_aff',
      allowDuplicateConversions: false,
      status: 'ACTIVE',
    },
  });

  const grabadsNet = await prisma.network.create({
    data: {
      name: 'Grabads',
      contactDetails: 'Email: contact@grabads.com',
      allowDuplicateConversions: false,
      status: 'ACTIVE',
    },
  });

  const nutraNet = await prisma.network.create({
    data: {
      name: 'Nutra - Layvaris',
      contactDetails: 'Telegram: @layvaris_nutra',
      allowDuplicateConversions: false,
      status: 'ACTIVE',
    },
  });

  console.log(`[Seed] Created Networks: ${everflowNet.name}, ${mobeekaNet.name}, ${grabadsNet.name}, ${nutraNet.name}`);

  // 5. Seed Core Offer: Luovia - OA (Matching exact client walkthrough at [00:13], [07:35])
  const luoviaOffer = await prisma.offer.create({
    data: {
      name: 'Luovia - OA',
      networkId: mobeekaNet.id,
      domainId: defaultDomain.id,
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      previewUrl: 'https://luovia.com/preview',
      description: 'Luovia CPA campaign with high payout for verified publishers.',
      destinationUrl: 'https://luovia.com/checkout?clickid={clickid}&aff_id={aff_id}&sub={sub_id}',
      enforceIpUniqueness: false,
      blockDuplicateIps: false,
    },
  });

  await prisma.offerTargetingGroup.create({
    data: {
      offerId: luoviaOffer.id,
      name: 'Targeting group #1',
      conditionOp: 'AND',
      isEnabled: true,
      devices: ['ALL', 'PC', 'Android', 'iOS'],
      countries: ['ALL', 'US', 'GB', 'CA'],
      excludeCountries: false,
    },
  });

  await prisma.offerPayout.create({
    data: {
      offerId: luoviaOffer.id,
      title: 'Default Payout',
      goalValue: '1',
      paymentModel: 'CPA_FIXED',
      currency: 'USD',
      revenue: 225.0, // Per conversion revenue: 5 * 225 = $1125.00
      payout: 150.0,  // Per conversion payout: 5 * 150 = $750.00
    },
  });

  // Assign Farhan to Luovia - OA
  await prisma.offerPublisher.create({
    data: {
      offerId: luoviaOffer.id,
      publisherId: farhan.id,
      isEnabled: true,
      approvalStatus: 'APPROVED',
    },
  });

  // Seed Other Offers
  const fusionOffer = await prisma.offer.create({
    data: {
      name: 'Fusion',
      networkId: everflowNet.id,
      domainId: defaultDomain.id,
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      destinationUrl: 'https://fusion-promo.com?c={clickid}&p={aff_id}',
    },
  });
  await prisma.offerPayout.create({
    data: {
      offerId: fusionOffer.id,
      revenue: 80.0,
      payout: 50.0,
    },
  });

  const bioOffer = await prisma.offer.create({
    data: {
      name: 'BIO',
      networkId: grabadsNet.id,
      domainId: defaultDomain.id,
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      destinationUrl: 'https://bio-health.com?tx={clickid}',
    },
  });
  await prisma.offerPayout.create({
    data: {
      offerId: bioOffer.id,
      revenue: 60.0,
      payout: 40.0,
    },
  });

  const layvarisOffer = await prisma.offer.create({
    data: {
      name: 'Layvaris Keto - MM',
      networkId: nutraNet.id,
      domainId: defaultDomain.id,
      visibility: 'REQUIRES_APPROVAL',
      status: 'ACTIVE',
      destinationUrl: 'https://layvaris.com/keto?click={clickid}',
    },
  });
  await prisma.offerPayout.create({
    data: {
      offerId: layvarisOffer.id,
      revenue: 140.0,
      payout: 90.0,
    },
  });

  console.log(`[Seed] Created Offers: ${luoviaOffer.name}, ${fusionOffer.name}, ${bioOffer.name}, ${layvarisOffer.name}`);

  // 6. Seed Exact Walkthrough Telemetry: 68 clicks & 5 conversions for Farhan on Luovia - OA
  // This produces exactly: 68 clicks, 5 conversions, $750.00 payout, $1125.00 revenue, and $11.03 EPC!
  const clickIds: string[] = [];
  const baseTime = new Date('2026-10-17T12:00:00Z');

  for (let i = 0; i < 68; i++) {
    const clickId = crypto.randomUUID();
    clickIds.push(clickId);

    const clickDate = new Date(baseTime);
    clickDate.setMinutes(clickDate.getMinutes() + i * 5);

    await prisma.click.create({
      data: {
        id: clickId,
        offerId: luoviaOffer.id,
        publisherId: farhan.id,
        subId: `test_sub_${i}`,
        ipAddress: `192.168.1.${10 + (i % 50)}`,
        countryCode: 'US',
        deviceType: i % 2 === 0 ? 'PC' : 'Mobile',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: clickDate,
      },
    });
  }

  // 5 Conversions out of the 68 clicks (status: UNCHECKED to match [07:43] unchecked conversions)
  for (let j = 0; j < 5; j++) {
    const convClickId = clickIds[j * 10]!;
    await prisma.conversion.create({
      data: {
        clickId: convClickId,
        offerId: luoviaOffer.id,
        publisherId: farhan.id,
        networkId: mobeekaNet.id,
        goalValue: '1',
        status: 'UNCHECKED', // Matches client report [07:43]: 5 Unchecked conversions
        currency: 'USD',
        revenue: 225.0, // 5 * 225 = $1125.00
        payout: 150.0,  // 5 * 150 = $750.00
        createdAt: new Date('2026-10-17T13:30:00Z'),
      },
    });
  }

  console.log(`[Seed] Successfully seeded 68 clicks and 5 conversions ($750.00 Payout / $11.03 EPC).`);
  console.log('[Seed] Database initialization complete!');
}

seed()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
