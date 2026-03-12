// controllers/tableController.js
// Table management - Admin and Manager access

const pool = require('../config/db');

const VALID_STATUSES = ['Empty', 'Occupied'];

// GET /api/tables - List all tables
const getAllTables = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT table_id, table_number, status FROM dining_tables ORDER BY table_number ASC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllTables error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tables.' });
  }
};

// GET /api/tables/:id - Get a single table
const getTableById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT table_id, table_number, status FROM dining_tables WHERE table_id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getTableById error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve table.' });
  }
};

// PATCH /api/tables/:id/status - Update table status (Admin / Manager)
// Body: { "status": "Empty" } or { "status": "Occupied" }
const updateTableStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status field is required.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE dining_tables SET status = ? WHERE table_id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }
    return res.status(200).json({
      success: true,
      message: `Table status updated to "${status}".`,
      data: { table_id: Number(id), status },
    });
  } catch (error) {
    console.error('updateTableStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update table status.' });
  }
};

module.exports = { getAllTables, getTableById, updateTableStatus };
