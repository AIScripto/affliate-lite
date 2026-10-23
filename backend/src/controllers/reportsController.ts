import { Request, Response } from 'express';
import { query } from '../config/db';

export async function getMasterReports(req: Request, res: Response): Promise<void> {
  try {
    // 1. Core Top-Level KPI Summary Cards
    // Total Clicks
    const clicksCountRes = await query(`SELECT COUNT(*) AS total_clicks FROM clicks_traffic;`);
    const totalClicks = parseInt(clicksCountRes.rows[0].total_clicks, 10);

    // Financial Totals: Direct Profit, Sub Override, Sub Payable, Total Gross
    const financeRes = await query(`
      SELECT 
        COALESCE(SUM(c.sale_amount), 0) AS total_sales_volume,
        COALESCE(SUM(c.gross_comm), 0) AS total_gross_comm,
        COALESCE(SUM(CASE WHEN t.ref_code = 'direct' THEN c.net_profit ELSE 0 END), 0) AS direct_profit,
        COALESCE(SUM(CASE WHEN t.ref_code != 'direct' THEN c.net_profit ELSE 0 END), 0) AS sub_override_profit,
        COALESCE(SUM(c.sub_pay), 0) AS sub_payable_liability
      FROM conversions_sales c
      JOIN clicks_traffic t ON c.click_id = t.click_id;
    `);

    const finance = financeRes.rows[0];

    // 2. Direct vs Sub-Affiliate Revenue Comparison
    const comparisonRes = await query(`
      SELECT 
        CASE WHEN t.ref_code = 'direct' THEN 'Direct Master Links' ELSE 'Sub-Affiliate Network' END AS category,
        COUNT(DISTINCT t.click_id) AS clicks,
        COUNT(DISTINCT c.id) AS orders,
        COALESCE(SUM(c.sale_amount), 0) AS total_sale_amount,
        COALESCE(SUM(c.gross_comm), 0) AS gross_commission,
        COALESCE(SUM(c.sub_pay), 0) AS sub_payout,
        COALESCE(SUM(c.net_profit), 0) AS net_master_profit,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0) * 100), 2) AS conversion_rate,
        ROUND((COALESCE(SUM(c.gross_comm), 0)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0)), 2) AS epc
      FROM clicks_traffic t
      LEFT JOIN conversions_sales c ON t.click_id = c.click_id
      GROUP BY category;
    `);

    // 3. Sub-Affiliate Leaderboard & Fraud Audit
    // Ranks every sub-affiliate, flags fraud if clicks > 100 with 0% CR or abnormal spikes
    const leaderboardRes = await query(`
      SELECT 
        u.id,
        u.full_name,
        u.ref_code,
        u.split_pct,
        u.wallet_pending,
        u.wallet_approved,
        COUNT(DISTINCT t.click_id) AS clicks,
        COUNT(DISTINCT c.id) AS orders,
        COALESCE(SUM(c.sale_amount), 0) AS volume,
        COALESCE(SUM(c.gross_comm), 0) AS gross_commission,
        COALESCE(SUM(c.sub_pay), 0) AS sub_earnings,
        COALESCE(SUM(c.net_profit), 0) AS master_override,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0) * 100), 2) AS cr_pct,
        ROUND((COALESCE(SUM(c.sub_pay), 0)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0)), 2) AS epc,
        CASE 
          WHEN COUNT(DISTINCT t.click_id) >= 200 AND COUNT(DISTINCT c.id) = 0 THEN true
          ELSE false 
        END AS is_suspicious_spike
      FROM users u
      LEFT JOIN clicks_traffic t ON u.id = t.user_id
      LEFT JOIN conversions_sales c ON t.click_id = c.click_id
      WHERE u.role = 'sub_aff'
      GROUP BY u.id, u.full_name, u.ref_code, u.split_pct, u.wallet_pending, u.wallet_approved
      ORDER BY orders DESC, clicks DESC;
    `);

    // 4. Traffic Channels / Sources Breakdown
    const sourcesRes = await query(`
      SELECT 
        COALESCE(t.src, 'unknown') AS source,
        COUNT(DISTINCT t.click_id) AS clicks,
        COUNT(DISTINCT c.id) AS conversions,
        COALESCE(SUM(c.gross_comm), 0) AS total_commission,
        ROUND((COUNT(DISTINCT c.id)::numeric / NULLIF(COUNT(DISTINCT t.click_id), 0) * 100), 2) AS cr_pct
      FROM clicks_traffic t
      LEFT JOIN conversions_sales c ON t.click_id = c.click_id
      GROUP BY t.src
      ORDER BY clicks DESC;
    `);

    // 5. Geo and Device Breakdown
    const geoRes = await query(`
      SELECT 
        country,
        COUNT(*) AS clicks
      FROM clicks_traffic
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT 6;
    `);

    const deviceRes = await query(`
      SELECT 
        device,
        COUNT(*) AS clicks
      FROM clicks_traffic
      GROUP BY device
      ORDER BY clicks DESC;
    `);

    // 6. Live Conversion & Attribution Stream
    const streamRes = await query(`
      SELECT 
        c.id,
        c.click_id,
        c.brand_order_id,
        c.sale_amount,
        c.gross_comm,
        c.sub_pay,
        c.net_profit,
        c.status,
        c.created_at,
        t.ref_code,
        t.src,
        t.camp,
        u.full_name AS promoter,
        b.brand_name,
        p.title AS product_title
      FROM conversions_sales c
      JOIN clicks_traffic t ON c.click_id = t.click_id
      JOIN users u ON t.user_id = u.id
      JOIN products p ON t.product_id = p.id
      JOIN brand_params b ON p.brand_id = b.id
      ORDER BY c.created_at DESC
      LIMIT 15;
    `);

    res.json({
      success: true,
      summary: {
        totalClicks,
        totalSalesVolume: parseFloat(finance.total_sales_volume),
        totalGrossComm: parseFloat(finance.total_gross_comm),
        directProfit: parseFloat(finance.direct_profit),
        subOverrideProfit: parseFloat(finance.sub_override_profit),
        subPayableLiability: parseFloat(finance.sub_payable_liability),
      },
      directVsSub: comparisonRes.rows,
      leaderboard: leaderboardRes.rows,
      trafficSources: sourcesRes.rows,
      geography: geoRes.rows,
      devices: deviceRes.rows,
      liveStream: streamRes.rows,
    });
  } catch (error) {
    console.error('Error compiling master reports:', error);
    res.status(500).json({ error: 'Failed to compile master reporting data' });
  }
}
