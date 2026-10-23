import { pool } from '../config/db';

export async function seedDatabase() {
  console.log('🌱 Seeding database with initial records...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Users (Master Admin + Sub-Affiliates)
    const adminRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, ref_code, split_pct, wallet_pending, wallet_approved)
      VALUES 
        ('admin@affiliatex.com', '$2a$10$demoHashedPasswordMasterAdmin', 'Master Admin', 'admin', 'direct', 100.00, 0.00, 4280.00)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    const adminId = adminRes.rows[0].id;

    const sub1Res = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, ref_code, split_pct, wallet_pending, wallet_approved)
      VALUES 
        ('ali@influencer.io', '$2a$10$demoHashedPasswordSubAli', 'Ali Khan (Tech Reviews)', 'sub_aff', 'sub_ali_05', 60.00, 240.00, 1240.00)
      ON CONFLICT (email) DO UPDATE SET split_pct = EXCLUDED.split_pct
      RETURNING id;
    `);
    const sub1Id = sub1Res.rows[0].id;

    const sub2Res = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, ref_code, split_pct, wallet_pending, wallet_approved)
      VALUES 
        ('sarah@fashionblogger.com', '$2a$10$demoHashedPasswordSubSarah', 'Sarah Jenkins', 'sub_aff', 'sub_sarah_12', 65.00, 180.00, 890.00)
      ON CONFLICT (email) DO UPDATE SET split_pct = EXCLUDED.split_pct
      RETURNING id;
    `);
    const sub2Id = sub2Res.rows[0].id;

    const sub3Res = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, ref_code, split_pct, wallet_pending, wallet_approved)
      VALUES 
        ('deals@couponhub.com', '$2a$10$demoHashedPasswordSubCoupon', 'Coupon & Deals Master', 'sub_aff', 'sub_deals_pro', 50.00, 520.00, 2150.00)
      ON CONFLICT (email) DO UPDATE SET split_pct = EXCLUDED.split_pct
      RETURNING id;
    `);
    const sub3Id = sub3Res.rows[0].id;

    // 2. Seed Brand Parameter Registry Definitions
    const brand1Res = await client.query(`
      INSERT INTO brand_params (brand_name, master_aff_id, url_template, click_id_param_key, sub_ref_param_key, postback_secret)
      VALUES (
        'Nike Sportswear',
        'M_NIKE_992',
        'https://brand.com/p/{sku}?partner_id={master_id}&click_ref={click_id}&sub={ref}',
        'click_ref',
        'sub',
        'sec_nike_postback_99182'
      )
      RETURNING id;
    `);
    const brandNikeId = brand1Res.rows[0].id;

    const brand2Res = await client.query(`
      INSERT INTO brand_params (brand_name, master_aff_id, url_template, click_id_param_key, sub_ref_param_key, postback_secret)
      VALUES (
        'Impact / CJ Tech Network',
        'CJ_MASTER_88',
        'https://brand.pxf.io/c/{master_id}/4912/81?subId1={click_id}&subId2={ref}',
        'subId1',
        'subId2',
        'sec_cj_network_44109'
      )
      RETURNING id;
    `);
    const brandCjId = brand2Res.rows[0].id;

    const brand3Res = await client.query(`
      INSERT INTO brand_params (brand_name, master_aff_id, url_template, click_id_param_key, sub_ref_param_key, postback_secret)
      VALUES (
        'Shopify Luxury Bags',
        'SHOP_LUX_21',
        'https://shop.com/products/bag?rfsn={master_id}&subid={click_id}&utm_source={ref}',
        'subid',
        'utm_source',
        'sec_shopify_lux_10293'
      )
      RETURNING id;
    `);
    const brandShopifyId = brand3Res.rows[0].id;

    // 3. Seed Products
    const prod1Res = await client.query(`
      INSERT INTO products (brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url)
      VALUES (
        $1,
        'Nike Air Zoom Pegasus 40',
        'running-shoe-123',
        'https://nike.com/products/air-zoom-pegasus-40',
        130.00,
        15.00,
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
      )
      RETURNING id;
    `, [brandNikeId]);
    const prod1Id = prod1Res.rows[0].id;

    const prod2Res = await client.query(`
      INSERT INTO products (brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url)
      VALUES (
        $1,
        'Noise-Canceling Studio Pro Buds',
        'pro-wireless-buds',
        'https://electronics.impact.com/item/pro-buds-wireless',
        199.00,
        20.00,
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'
      )
      RETURNING id;
    `, [brandCjId]);
    const prod2Id = prod2Res.rows[0].id;

    const prod3Res = await client.query(`
      INSERT INTO products (brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url)
      VALUES (
        $1,
        'Artisan Italian Leather Briefcase',
        'leather-briefcase-lux',
        'https://luxuryleather.myshopify.com/products/artisan-briefcase',
        280.00,
        18.00,
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80'
      )
      RETURNING id;
    `, [brandShopifyId]);
    const prod3Id = prod3Res.rows[0].id;

    // 4. Seed Representative Clicks
    const clicksData = [
      {
        click_id: 'clk_98412_yt01',
        user_id: sub1Id,
        product_id: prod1Id,
        ref_code: 'sub_ali_05',
        src: 'youtube',
        camp: 'winter_runner_review',
        country: 'United States',
        city: 'New York',
        device: 'Mobile',
        os: 'iOS',
        browser: 'Safari',
        outbound_url: 'https://brand.com/p/running-shoe-123?partner_id=M_NIKE_992&click_ref=clk_98412_yt01&sub=sub_ali_05'
      },
      {
        click_id: 'clk_98413_ig02',
        user_id: sub2Id,
        product_id: prod3Id,
        ref_code: 'sub_sarah_12',
        src: 'instagram',
        camp: 'autumn_lookbook',
        country: 'United Kingdom',
        city: 'London',
        device: 'Mobile',
        os: 'iOS',
        browser: 'Instagram App',
        outbound_url: 'https://shop.com/products/bag?rfsn=SHOP_LUX_21&subid=clk_98413_ig02&utm_source=sub_sarah_12'
      },
      {
        click_id: 'clk_98414_dir03',
        user_id: adminId,
        product_id: prod2Id,
        ref_code: 'direct',
        src: 'seo_blog',
        camp: 'best_noise_canceling_2026',
        country: 'Germany',
        city: 'Berlin',
        device: 'Desktop',
        os: 'macOS',
        browser: 'Chrome',
        outbound_url: 'https://brand.pxf.io/c/CJ_MASTER_88/4912/81?subId1=clk_98414_dir03&subId2=direct'
      },
      {
        click_id: 'clk_98415_tt04',
        user_id: sub1Id,
        product_id: prod2Id,
        ref_code: 'sub_ali_05',
        src: 'tiktok',
        camp: 'unboxing_series',
        country: 'Canada',
        city: 'Toronto',
        device: 'Mobile',
        os: 'Android',
        browser: 'TikTok App',
        outbound_url: 'https://brand.pxf.io/c/CJ_MASTER_88/4912/81?subId1=clk_98415_tt04&subId2=sub_ali_05'
      },
      {
        click_id: 'clk_98416_dir05',
        user_id: adminId,
        product_id: prod1Id,
        ref_code: 'direct',
        src: 'email_newsletter',
        camp: 'weekly_staff_picks',
        country: 'United States',
        city: 'San Francisco',
        device: 'Desktop',
        os: 'Windows',
        browser: 'Chrome',
        outbound_url: 'https://brand.com/p/running-shoe-123?partner_id=M_NIKE_992&click_ref=clk_98416_dir05&sub=direct'
      }
    ];

    for (const c of clicksData) {
      await client.query(`
        INSERT INTO clicks_traffic (
          click_id, user_id, product_id, ref_code, src, camp, 
          ip_hash, country, city, device, os, browser, outbound_url, clicked_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          $7, $8, $9, $10, $11, $12, NOW() - INTERVAL '2 hours'
        )
        ON CONFLICT (click_id) DO NOTHING;
      `, [c.click_id, c.user_id, c.product_id, c.ref_code, c.src, c.camp, c.country, c.city, c.device, c.os, c.browser, c.outbound_url]);
    }

    // 5. Seed Conversions with Ledger Splits
    // Conversion 1: Sub-Affiliate (Ali Khan - 60% split of $19.50 commission = $11.70 sub, $7.80 net master override)
    await client.query(`
      INSERT INTO conversions_sales (
        click_id, brand_order_id, sale_amount, gross_comm, sub_pay, net_profit, status, raw_payload
      ) VALUES (
        'clk_98412_yt01',
        'ORD-NIKE-88192',
        130.00,
        19.50,
        11.70,
        7.80,
        'approved',
        '{"item": "Nike Air Zoom", "brand": "Nike"}'::jsonb
      )
      ON CONFLICT (brand_order_id) DO NOTHING;
    `);

    // Conversion 2: Direct Promotion (Master keeps 100% of $39.80 commission = $0.00 sub liability, $39.80 net)
    await client.query(`
      INSERT INTO conversions_sales (
        click_id, brand_order_id, sale_amount, gross_comm, sub_pay, net_profit, status, raw_payload
      ) VALUES (
        'clk_98414_dir03',
        'ORD-CJ-44912',
        199.00,
        39.80,
        0.00,
        39.80,
        'approved',
        '{"item": "Noise-Canceling Pro Buds", "network": "CJ"}'::jsonb
      )
      ON CONFLICT (brand_order_id) DO NOTHING;
    `);

    // Conversion 3: Sub-Affiliate (Sarah Jenkins - 65% split of $50.40 commission = $32.76 sub, $17.64 net master override)
    await client.query(`
      INSERT INTO conversions_sales (
        click_id, brand_order_id, sale_amount, gross_comm, sub_pay, net_profit, status, raw_payload
      ) VALUES (
        'clk_98413_ig02',
        'ORD-SHP-10928',
        280.00,
        50.40,
        32.76,
        17.64,
        'pending',
        '{"item": "Artisan Leather Briefcase", "store": "Shopify"}'::jsonb
      )
      ON CONFLICT (brand_order_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with users, brands, products, clicks, and split ledger entries.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed database:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
