import { Request, Response } from 'express';
import { query } from '../config/db';
import { parseTelemetry } from '../services/telemetry';
import { compileBrandUrl } from '../services/urlEngine';

export async function handleRedirect(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { product_slug } = req.params;
  const { ref, src, camp, sub1, sub2, preview, json } = req.query;

  const rawRef = typeof ref === 'string' && ref.trim() ? ref.trim() : 'direct';
  const rawSrc = typeof src === 'string' ? src : 'direct';
  const rawCamp = typeof camp === 'string' ? camp : 'default';
  const rawSub1 = typeof sub1 === 'string' ? sub1 : undefined;
  const rawSub2 = typeof sub2 === 'string' ? sub2 : undefined;

  try {
    // 1. Resolve product and its brand parameters
    const productRes = await query(`
      SELECT 
        p.id AS product_id,
        p.title,
        p.slug,
        p.destination_url,
        b.id AS brand_id,
        b.brand_name,
        b.master_aff_id,
        b.url_template,
        b.click_id_param_key,
        b.sub_ref_param_key
      FROM products p
      JOIN brand_params b ON p.brand_id = b.id
      WHERE p.slug = $1 AND p.is_active = true
      LIMIT 1;
    `, [product_slug]);

    if (productRes.rows.length === 0) {
      res.status(404).json({ error: 'Product or active campaign not found', slug: product_slug });
      return;
    }

    const product = productRes.rows[0];

    // 2. Resolve user associated with ref code (fallback to master direct if not found or inactive)
    let userRes = await query(`
      SELECT id, role, ref_code, status FROM users WHERE ref_code = $1 LIMIT 1;
    `, [rawRef]);

    let userId: string;
    let effectiveRefCode = rawRef;

    if (userRes.rows.length > 0 && userRes.rows[0].status !== 'inactive') {
      userId = userRes.rows[0].id;
    } else {
      // Fallback to direct admin if user not found or inactive
      const adminFallback = await query(`
        SELECT id FROM users WHERE ref_code = 'direct' LIMIT 1;
      `);
      userId = adminFallback.rows[0]?.id;
      effectiveRefCode = 'direct';
    }

    // 3. Telemetry capture & Click ID minting (<50ms target)
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const telemetry = parseTelemetry(userAgent, clientIp, req.headers);

    // 4. Dynamic URL translation & compile
    const outboundUrl = compileBrandUrl({
      urlTemplate: product.url_template,
      masterAffId: product.master_aff_id,
      clickId: telemetry.clickId,
      refCode: effectiveRefCode,
      sku: product.slug,
      extraParams: {
        ...(rawSrc && rawSrc !== 'direct' ? { utm_source: rawSrc } : {}),
        ...(rawCamp && rawCamp !== 'default' ? { utm_campaign: rawCamp } : {}),
      }
    });

    const executionTimeMs = Date.now() - startTime;

    // 5. Asynchronous persistence into clicks_traffic
    await query(`
      INSERT INTO clicks_traffic (
        click_id, user_id, product_id, ref_code, src, camp, sub1, sub2,
        ip_hash, country, city, device, os, browser, referrer, outbound_url, clicked_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      );
    `, [
      telemetry.clickId,
      userId,
      product.product_id,
      effectiveRefCode,
      rawSrc,
      rawCamp,
      rawSub1,
      rawSub2,
      telemetry.ipHash,
      telemetry.country,
      telemetry.city,
      telemetry.device,
      telemetry.os,
      telemetry.browser,
      req.headers['referer'] || null,
      outboundUrl
    ]);

    // If inspected via JSON or Preview mode for testing
    if (json === 'true' || preview === 'true') {
      res.json({
        success: true,
        click_id: telemetry.clickId,
        redirect_to: outboundUrl,
        latency_ms: executionTimeMs,
        telemetry: {
          ref: effectiveRefCode,
          src: rawSrc,
          camp: rawCamp,
          device: telemetry.device,
          os: telemetry.os,
          browser: telemetry.browser,
          country: telemetry.country,
          city: telemetry.city,
        },
        product: {
          title: product.title,
          brand: product.brand_name,
        }
      });
      return;
    }

    // Standard HTTP 302 Outbound Redirect
    res.setHeader('X-Click-Id', telemetry.clickId);
    res.setHeader('X-Execution-Time-Ms', executionTimeMs.toString());
    res.redirect(302, outboundUrl);
  } catch (error) {
    console.error('Error during redirect handling:', error);
    res.status(500).json({ error: 'Failed to process tracking redirect' });
  }
}
