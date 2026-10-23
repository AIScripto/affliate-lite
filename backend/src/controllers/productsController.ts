import { Request, Response } from 'express';
import { query } from '../config/db';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.destination_url,
        p.retail_price,
        p.default_comm_pct,
        p.image_url,
        p.is_active,
        b.id AS brand_id,
        b.brand_name,
        b.url_template
      FROM products p
      JOIN brand_params b ON p.brand_id = b.id
      ORDER BY p.title ASC;
    `);

    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to retrieve promotional products' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const { brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url } = req.body;

  if (!brand_id || !title || !slug || !destination_url) {
    res.status(400).json({ error: 'Missing mandatory fields: brand_id, title, slug, destination_url' });
    return;
  }

  try {
    const result = await query(`
      INSERT INTO products (
        brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      brand_id,
      title,
      slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-'),
      destination_url,
      parseFloat(retail_price || '0'),
      parseFloat(default_comm_pct || '10.00'),
      image_url || null
    ]);

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { brand_id, title, slug, destination_url, retail_price, default_comm_pct, image_url, is_active } = req.body;

  try {
    const result = await query(`
      UPDATE products
      SET
        brand_id = COALESCE($1, brand_id),
        title = COALESCE($2, title),
        slug = COALESCE($3, slug),
        destination_url = COALESCE($4, destination_url),
        retail_price = COALESCE($5, retail_price),
        default_comm_pct = COALESCE($6, default_comm_pct),
        image_url = COALESCE($7, image_url),
        is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *;
    `, [
      brand_id || null,
      title || null,
      slug ? slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-') : null,
      destination_url || null,
      retail_price !== undefined ? parseFloat(retail_price) : null,
      default_comm_pct !== undefined ? parseFloat(default_comm_pct) : null,
      image_url !== undefined ? image_url : null,
      is_active !== undefined ? is_active : null,
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, product: result.rows[0], message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM products WHERE id = $1 RETURNING id;`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product. It may be linked to active tracking clicks.' });
  }
}

export async function toggleProductStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const result = await query(`
      UPDATE products 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING id, title, is_active;
    `, [is_active === true, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, product: result.rows[0], message: `Product status updated` });
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({ error: 'Failed to toggle product status' });
  }
}

