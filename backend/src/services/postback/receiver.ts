import { Conversion, ConversionStatus, PostbackOutcome } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { parsePostbackParams, ParsedPostback } from './params';
import { selectPayoutRule, computeConversionAmounts, tokensMatch } from './payout';
import { logPostback } from './log';
import { sendPublisherPostback } from './publisherPostback';

type ClickWithOffer = NonNullable<Awaited<ReturnType<typeof findClick>>>;

function findClick(clickId: string) {
  return prisma.click.findUnique({
    where: { id: clickId },
    include: {
      offer: { include: { network: true, payouts: { orderBy: { id: 'asc' } } } },
      publisher: true,
    },
  });
}

/** Sends the publisher postback in the background when a conversion becomes APPROVED. */
function notifyPublisherIfApproved(click: ClickWithOffer, conversion: Conversion): void {
  const template = click.publisher.postbackUrl?.trim();
  if (!template || conversion.status !== 'APPROVED') return;

  void sendPublisherPostback({
    template,
    clickId: click.id,
    conversionId: conversion.id,
    offerId: click.offerId,
    publisherId: click.publisherId,
    macros: {
      clickid: click.id,
      click_id: click.id,
      sub_id: click.subId ?? '',
      payout: String(Number(conversion.payout)),
      currency: conversion.currency,
      goal: conversion.goalValue,
      status: conversion.status,
      offer_id: String(click.offerId),
      conversion_id: String(conversion.id),
    },
  });
}

function conversionBody(conversion: Conversion, extra: Record<string, unknown> = {}) {
  return {
    success: true,
    conversionId: conversion.id,
    clickId: conversion.clickId,
    goal: conversion.goalValue,
    status: conversion.status,
    payout: Number(conversion.payout),
    revenue: Number(conversion.revenue),
    currency: conversion.currency,
    externalTxId: conversion.externalTxId,
    ...extra,
  };
}

/**
 * A postback for a click + goal that already has a conversion:
 * - same status: a network retry, answered 200 without changing anything (idempotent)
 * - new status: a status change (pending -> approved, approved -> chargeback), applied
 */
async function applyToExisting(
  existing: Conversion,
  parsed: ParsedPostback,
  click: ClickWithOffer
): Promise<{ outcome: PostbackOutcome; conversion: Conversion; previousStatus?: ConversionStatus }> {
  if (existing.status === parsed.status) {
    return { outcome: 'DUPLICATE', conversion: existing };
  }
  const updated = await prisma.conversion.update({
    where: { id: existing.id },
    data: {
      status: parsed.status,
      ...(parsed.orderId && !existing.externalTxId ? { externalTxId: parsed.orderId } : {}),
    },
  });
  notifyPublisherIfApproved(click, updated);
  return { outcome: 'STATUS_UPDATED', conversion: updated, previousStatus: existing.status };
}

export interface PostbackRequest {
  method: string;
  params: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  ipAddress?: string;
}

export interface PostbackResult {
  httpStatus: number;
  outcome: PostbackOutcome;
  body: Record<string, unknown>;
}

/**
 * Processes one conversion postback (shared by the JSON endpoint and the image/iframe pixels).
 * Every request is written to postback_logs with its outcome.
 */
export async function processPostback(request: PostbackRequest): Promise<PostbackResult> {
  const logBase = { direction: 'INBOUND' as const, method: request.method, params: request.params, ipAddress: request.ipAddress };

  const reply = async (
    httpStatus: number,
    outcome: PostbackOutcome,
    body: Record<string, unknown>,
    meta: { clickId?: string; conversionId?: number; offerId?: number; publisherId?: number; message?: string } = {}
  ): Promise<PostbackResult> => {
    await logPostback({ ...logBase, ...meta, outcome, httpStatus });
    return { httpStatus, outcome, body };
  };

  const parsed = parsePostbackParams(request.params, request.headers);
  if (!parsed.ok) {
    return reply(parsed.httpStatus, 'REJECTED', { error: 'Bad Request', message: parsed.message, ...(parsed.clickId ? { clickid: parsed.clickId } : {}) }, {
      clickId: parsed.clickId,
      message: parsed.message,
    });
  }
  const p = parsed.value;

  const click = await findClick(p.clickId);
  if (!click) {
    return reply(404, 'REJECTED', { error: 'Not Found', message: 'Invalid clickid' }, { clickId: p.clickId, message: 'Click not found' });
  }
  const meta = { clickId: click.id, offerId: click.offerId, publisherId: click.publisherId };

  const expectedToken = click.offer.advertiserSecurityToken?.trim();
  if (expectedToken && !tokensMatch(expectedToken, p.token)) {
    const message = 'Invalid or missing advertiser security token';
    return reply(403, 'REJECTED', { error: 'Forbidden', message }, { ...meta, message });
  }

  // Same click + same goal already converted: retry or status change
  const existing = await prisma.conversion.findUnique({
    where: { clickId_goalValue: { clickId: click.id, goalValue: p.goal } },
  });
  if (existing) {
    const r = await applyToExisting(existing, p, click);
    return reply(
      200,
      r.outcome,
      conversionBody(r.conversion, r.outcome === 'DUPLICATE' ? { duplicate: true } : { updated: true, previousStatus: r.previousStatus }),
      { ...meta, conversionId: r.conversion.id }
    );
  }

  if (!click.offer.network.allowDuplicateConversions) {
    const other = await prisma.conversion.findFirst({ where: { clickId: click.id }, orderBy: { id: 'asc' } });
    // Same goal: an identical postback created it a moment ago (race), so treat it as a retry
    if (other && other.goalValue === p.goal) {
      const r = await applyToExisting(other, p, click);
      return reply(200, r.outcome, conversionBody(r.conversion, { duplicate: r.outcome === 'DUPLICATE' }), {
        ...meta,
        conversionId: r.conversion.id,
      });
    }
    if (other) {
      const message = `This click already has a conversion (goal ${other.goalValue}); this network allows only one per click`;
      return reply(409, 'REJECTED', { error: 'Conflict', message }, { ...meta, conversionId: other.id, message });
    }
  }

  const rule = selectPayoutRule(click.offer.payouts, p.goal);
  const amounts = computeConversionAmounts(rule, p.sum);

  let conversion: Conversion;
  try {
    conversion = await prisma.conversion.create({
      data: {
        clickId: click.id,
        offerId: click.offerId,
        publisherId: click.publisherId,
        networkId: click.offer.networkId,
        goalValue: p.goal,
        status: p.status,
        currency: amounts.currency,
        revenue: amounts.revenue,
        payout: amounts.payout,
        externalTxId: p.orderId ?? null,
      },
    });
  } catch (err: unknown) {
    // Two identical postbacks arrived at the same moment: the other one created it first
    if ((err as { code?: string })?.code === 'P2002') {
      const winner = await prisma.conversion.findUniqueOrThrow({
        where: { clickId_goalValue: { clickId: click.id, goalValue: p.goal } },
      });
      const r = await applyToExisting(winner, p, click);
      return reply(200, r.outcome, conversionBody(r.conversion, { duplicate: r.outcome === 'DUPLICATE' }), {
        ...meta,
        conversionId: r.conversion.id,
      });
    }
    throw err;
  }

  notifyPublisherIfApproved(click, conversion);
  return reply(200, 'CREATED', conversionBody(conversion), { ...meta, conversionId: conversion.id });
}
