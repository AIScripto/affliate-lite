import { Request, Response } from 'express';
import { query } from '../config/db';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT 
        id, 
        email, 
        full_name, 
        first_name, 
        last_name, 
        mobile_number, 
        status, 
        role, 
        ref_code, 
        split_pct, 
        wallet_pending, 
        wallet_approved,
        created_at
      FROM users
      ORDER BY role ASC, created_at DESC;
    `);

    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve user accounts' });
  }
}

export async function registerSubAffiliate(req: Request, res: Response): Promise<void> {
  const { 
    first_name, 
    last_name, 
    mobile_number, 
    email, 
    status, 
    ref_code, 
    split_pct 
  } = req.body;

  if (!email || !first_name) {
    res.status(400).json({ error: 'Missing mandatory fields: first_name and email are required.' });
    return;
  }

  const fName = String(first_name).trim();
  const lName = String(last_name || '').trim();
  const phone = String(mobile_number || '').trim();
  const userEmail = String(email).trim().toLowerCase();
  const userStatus = status === 'active' ? 'active' : 'inactive'; // Defaults to inactive
  const fullName = `${fName} ${lName}`.trim();

  // If ref_code is not supplied, auto-generate cleanly
  let cleanRef = ref_code ? String(ref_code).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_') : '';
  if (!cleanRef) {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    cleanRef = `sub_${fName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomSuffix}`;
  }

  try {
    const result = await query(`
      INSERT INTO users (
        email, 
        password_hash, 
        full_name, 
        first_name, 
        last_name, 
        mobile_number, 
        status, 
        role, 
        ref_code, 
        split_pct, 
        wallet_pending, 
        wallet_approved
      ) VALUES ($1, '$2a$10$demoDefaultPasswordHash', $2, $3, $4, $5, $6, 'sub_aff', $7, $8, 0.00, 0.00)
      RETURNING id, email, full_name, first_name, last_name, mobile_number, status, role, ref_code, split_pct, wallet_pending, wallet_approved;
    `, [
      userEmail, 
      fullName, 
      fName, 
      lName, 
      phone, 
      userStatus, 
      cleanRef, 
      parseFloat(split_pct || '60.00')
    ]);

    res.status(201).json({ success: true, user: result.rows[0], message: 'Sub-affiliate created successfully' });
  } catch (error: any) {
    console.error('Error creating sub-affiliate:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'A partner with this email or ref_code already exists.' });
      return;
    }
    res.status(500).json({ error: 'Failed to register sub-affiliate' });
  }
}

export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const targetStatus = status === 'active' ? 'active' : 'inactive';
    const result = await query(`
      UPDATE users 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, full_name, ref_code, status;
    `, [targetStatus, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, user: result.rows[0], message: `Status updated to ${targetStatus}` });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { first_name, last_name, email, mobile_number, split_pct, status } = req.body;

  try {
    const fName = first_name ? String(first_name).trim() : null;
    const lName = last_name !== undefined ? String(last_name).trim() : null;
    const fullName = fName ? `${fName} ${lName || ''}`.trim() : null;

    const result = await query(`
      UPDATE users
      SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        full_name = COALESCE($3, full_name),
        email = COALESCE($4, email),
        mobile_number = COALESCE($5, mobile_number),
        split_pct = COALESCE($6, split_pct),
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id, email, full_name, first_name, last_name, mobile_number, status, role, ref_code, split_pct, wallet_pending, wallet_approved;
    `, [
      fName,
      lName,
      fullName,
      email ? String(email).trim().toLowerCase() : null,
      mobile_number !== undefined ? String(mobile_number).trim() : null,
      split_pct !== undefined ? parseFloat(split_pct) : null,
      status || null,
      id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, user: result.rows[0], message: 'Partner updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update partner details' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const userRes = await query(`SELECT role FROM users WHERE id = $1;`, [id]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (userRes.rows[0].role === 'admin') {
      res.status(400).json({ error: 'Cannot delete master admin account' });
      return;
    }

    await query(`DELETE FROM users WHERE id = $1;`, [id]);
    res.json({ success: true, message: 'Partner account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete partner. Check if active traffic/conversions exist.' });
  }
}

