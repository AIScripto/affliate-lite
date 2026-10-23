import { Request, Response } from 'express';
import { query } from '../config/db';
import { calculateCommissionSplit } from '../services/ledgerSplit';

export async function handlePostback(req: Request, res: Response): Promise<void> {
  const method = req.method;
  const payload = method === 'GET' ? req.query : req.body;

  const click_id = String(payload.click_id || payload.click_ref || payload.subId1 || payload.subid || '');
  const brand_order_id = String(payload.order_id || payload.brand_order_id || payload.transaction_id || '');
  const sale_amount = parseFloat(String(payload.sale_amount || payload.amount || payload.order_value || '0'));
  const gross_comm = parseFloat(String(payload.commission || payload.gross_comm || payload.payout || '0'));
  const secret_token = String(payload.secret || payload.token || req.headers['x-postback-secret'] || '');

  if (!click_id) {
    res.status(400).json({ error: 'Missing required parameter: click_id' });
    return;
  }

  if (!brand_order_id) {
    res.status(400).json({ error: 'Missing required parameter: order_id' });
    return;
  }

  try {
    // 1. Deduplication check: Has this order already been converted?
    const existingConversion = await query(`
      SELECT id, click_id, brand_order_id, status FROM conversions_sales 
      WHERE brand_order_id = $1 LIMIT 1;
    `, [brand_order_id]);

    if (existingConversion.rows.length > 0) {
      res.status(200).json({
        message: 'Order already processed (idempotent)',
        conversion_id: existingConversion.rows[0].id,
        brand_order_id,
        duplicate: true
      });
      return;
    }

    // 2. Click lookup & Brand verification
    const clickRes = await query(`
      SELECT 
        c.click_id,
        c.user_id,
        c.product_id,
        c.ref_code,
        u.role,
        u.split_pct,
        u.full_name,
        b.postback_secret,
        b.brand_name
      FROM clicks_traffic c
      JOIN users u ON c.user_id = u.id
      JOIN products p ON c.product_id = p.id
      JOIN brand_params b ON p.brand_id = b.id
      WHERE c.click_id = $1
      LIMIT 1;
    `, [click_id]);

    if (clickRes.rows.length === 0) {
      res.status(404).json({ error: 'Unmatched click_id. Attribution record not found.', click_id });
      return;
    }

    const clickData = clickRes.rows[0];

    // Optional postback secret validation (if configured on brand)
    if (clickData.postback_secret && secret_token && clickData.postback_secret !== secret_token) {
      res.status(401).json({ error: 'Invalid postback authentication secret token' });
      return;
    }

    // 3. Automated Commission Split Calculation
    const split = calculateCommissionSplit({
      role: clickData.role,
      refCode: clickData.ref_code,
      splitPct: parseFloat(clickData.split_pct),
      grossCommission: gross_comm,
    });

    // 4. Atomic transaction insertion into conversions_sales & wallet update
    await query('BEGIN');

    const conversionRes = await query(`
      INSERT INTO conversions_sales (
        click_id, brand_order_id, sale_amount, gross_comm, sub_pay, net_profit, status, raw_payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending', $7
      )
      RETURNING id, created_at;
    `, [
      click_id,
      brand_order_id,
      sale_amount,
      gross_comm,
      split.subPay,
      split.netProfit,
      JSON.stringify(payload)
    ]);

    const newConversion = conversionRes.rows[0];

    // If sub-affiliate had a commission, increment wallet_pending
    if (split.subPay > 0) {
      await query(`
        UPDATE users 
        SET wallet_pending = wallet_pending + $1, updated_at = NOW()
        WHERE id = $2;
      `, [split.subPay, clickData.user_id]);
    }

    await query('COMMIT');

    res.status(200).json({
      success: true,
      conversion_id: newConversion.id,
      click_id,
      brand_order_id,
      brand: clickData.brand_name,
      attribution: {
        promoter: clickData.full_name,
        ref_code: clickData.ref_code,
        is_direct: split.isDirect,
        sale_amount,
        gross_commission: gross_comm,
        sub_affiliate_payout: split.subPay,
        master_override_net_profit: split.netProfit,
        status: 'pending'
      }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error handling S2S postback:', error);
    res.status(500).json({ error: 'Internal error processing postback attribution' });
  }
}
