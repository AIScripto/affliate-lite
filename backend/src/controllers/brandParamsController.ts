import { Request, Response } from 'express';
import { query } from '../config/db';

export async function getBrandParams(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT 
        id, 
        brand_name, 
        master_aff_id, 
        url_template, 
        click_id_param_key, 
        sub_ref_param_key, 
        postback_secret, 
        COALESCE(custom_params, '[]'::jsonb) AS custom_params,
        created_at, 
        updated_at
      FROM brand_params
      ORDER BY brand_name ASC;
    `);

    res.json({ success: true, brands: result.rows });
  } catch (error) {
    console.error('Error fetching brand parameters:', error);
    res.status(500).json({ error: 'Failed to retrieve brand parameters' });
  }
}

export async function saveBrandParam(req: Request, res: Response): Promise<void> {
  const { id, brand_name, master_aff_id, url_template, click_id_param_key, sub_ref_param_key, postback_secret, custom_params } = req.body;

  if (!brand_name || !master_aff_id || !url_template) {
    res.status(400).json({ error: 'Missing required fields: brand_name, master_aff_id, and url_template are mandatory.' });
    return;
  }

  const customParamsJson = JSON.stringify(custom_params || []);

  try {
    if (id) {
      // Update
      const updateRes = await query(`
        UPDATE brand_params
        SET 
          brand_name = $1,
          master_aff_id = $2,
          url_template = $3,
          click_id_param_key = $4,
          sub_ref_param_key = $5,
          postback_secret = $6,
          custom_params = $7::jsonb,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *;
      `, [brand_name, master_aff_id, url_template, click_id_param_key || 'click_ref', sub_ref_param_key || 'sub', postback_secret || 'sec_' + Math.random().toString(36).substring(2), customParamsJson, id]);

      res.json({ success: true, brand: updateRes.rows[0], message: 'Brand parameters updated successfully' });
    } else {
      // Insert
      const insertRes = await query(`
        INSERT INTO brand_params (
          brand_name, master_aff_id, url_template, click_id_param_key, sub_ref_param_key, postback_secret, custom_params
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb
        )
        RETURNING *;
      `, [brand_name, master_aff_id, url_template, click_id_param_key || 'click_ref', sub_ref_param_key || 'sub', postback_secret || 'sec_' + Math.random().toString(36).substring(2), customParamsJson]);

      res.status(201).json({ success: true, brand: insertRes.rows[0], message: 'Brand registered successfully' });
    }
  } catch (error) {
    console.error('Error saving brand parameters:', error);
    res.status(500).json({ error: 'Failed to save brand parameter definition' });
  }
}

export async function deleteBrandParam(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await query(`DELETE FROM brand_params WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Brand parameter definition deleted' });
  } catch (error) {
    console.error('Error deleting brand parameter:', error);
    res.status(500).json({ error: 'Failed to delete brand parameter definition. Check if products reference it.' });
  }
}
