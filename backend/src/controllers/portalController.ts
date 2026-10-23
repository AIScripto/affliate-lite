import { Request, Response } from 'express';
import { query } from '../config/db';

export async function getSubAffiliateStats(req: Request, res: Response): Promise<void> {
  // Can be resolved via auth header or query ?ref_code=... or ?user_id=...
  const ref_code = (req.query.ref_code as string) || (req.headers['x-ref-code'] as string) || 'sub_ali_05';

  try {
    // 1. Fetch User details & wallets
    const userRes = await query(`
      SELECT id, full_name, email, role, ref_code, split_pct, wallet_pending, wallet_approved
      FROM users
      WHERE ref_code = $1
      LIMIT 1;
    `, [ref_code]);

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Sub-Affiliate account not found', ref_code });
      return;
    }

    const user = userRes.rows[0];

    // 2. Personal 30-Day Clicks and Orders
    const clicksRes = await query(`
      SELECT 
        COUNT(DISTINCT t.click_id) AS total_clicks,
        COUNT(DISTINCT c.id) AS total_orders,
        COALESCE(SUM(c.sale_amount), 0) AS total_sales_volume,
        COALESCE(SUM(c.sub_pay), 0) AS total_earned
      FROM clicks_traffic t
      LEFT JOIN conversions_sales c ON t.click_id = c.click_id
      WHERE t.user_id = $1;
    `, [user.id]);

    const stats = clicksRes.rows[0];
    const totalClicks = parseInt(stats.total_clicks, 10);
    const totalOrders = parseInt(stats.total_orders, 10);
    const totalEarned = parseFloat(stats.total_earned);
    const crPct = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(2)) : 0;
    const epc = totalClicks > 0 ? Number((totalEarned / totalClicks).toFixed(2)) : 0;

    // 3. Traffic by Channel / Source & Sold Items
    const sourceBreakdownRes = await query(`
      SELECT 
        COALESCE(t.src, 'direct') AS source,
        COUNT(DISTINCT t.click_id) AS clicks,
        COUNT(DISTINCT c.id) AS orders_sold,
        COALESCE(SUM(c.sub_pay), 0) AS earned,
        ROUND((COALESCE(SUM(c.sub_pay), 0)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0)), 2) AS epc,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0) * 100), 2) AS cr_pct
      FROM clicks_traffic t
      LEFT JOIN conversions_sales c ON t.click_id = c.click_id
      WHERE t.user_id = $1
      GROUP BY t.src
      ORDER BY clicks DESC;
    `, [user.id]);

    // 4. Personal Sales & Conversion Ledger
    const ledgerRes = await query(`
      SELECT 
        c.id,
        c.click_id,
        c.brand_order_id,
        c.sale_amount,
        c.sub_pay AS my_commission,
        c.status,
        c.created_at,
        t.src,
        t.camp,
        p.title AS product_name,
        b.brand_name
      FROM conversions_sales c
      JOIN clicks_traffic t ON c.click_id = t.click_id
      JOIN products p ON t.product_id = p.id
      JOIN brand_params b ON p.brand_id = b.id
      WHERE t.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT 20;
    `, [user.id]);

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        refCode: user.ref_code,
        splitPct: parseFloat(user.split_pct),
        walletPending: parseFloat(user.wallet_pending),
        walletApproved: parseFloat(user.wallet_approved),
      },
      metrics: {
        clicks30d: totalClicks,
        orders: totalOrders,
        conversionRate: crPct,
        epc,
        totalEarned,
      },
      trafficBySource: sourceBreakdownRes.rows,
      personalLedger: ledgerRes.rows,
    });
  } catch (error) {
    console.error('Error fetching sub-affiliate portal stats:', error);
    res.status(500).json({ error: 'Failed to retrieve partner portal statistics' });
  }
}

export async function requestPayout(req: Request, res: Response): Promise<void> {
  const { user_id, amount } = req.body;

  try {
    const userRes = await query(`SELECT wallet_approved, full_name FROM users WHERE id = $1;`, [user_id]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const approvedBalance = parseFloat(userRes.rows[0].wallet_approved);
    const requestedAmount = parseFloat(amount || approvedBalance);

    if (requestedAmount <= 0 || requestedAmount > approvedBalance) {
      res.status(400).json({ error: 'Invalid payout amount. Amount cannot exceed approved balance.' });
      return;
    }

    // Deduct approved wallet balance
    await query(`
      UPDATE users 
      SET wallet_approved = wallet_approved - $1, updated_at = NOW() 
      WHERE id = $2;
    `, [requestedAmount, user_id]);

    res.json({
      success: true,
      message: `Payout request of $${requestedAmount.toFixed(2)} submitted successfully.`,
      remaining_approved_wallet: approvedBalance - requestedAmount
    });
  } catch (error) {
    console.error('Error processing payout request:', error);
    res.status(500).json({ error: 'Failed to submit payout request' });
  }
}
