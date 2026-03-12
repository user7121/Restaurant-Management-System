// controllers/tableController.js
// Masa yönetimi - Admin ve Manager ortak yetkisi

const pool = require('../config/db');

const VALID_STATUSES = ['Empty', 'Occupied'];

// GET /api/tables - Tüm masaları listele
const getAllTables = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT table_id, table_number, status FROM dining_tables ORDER BY table_number ASC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllTables hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Masalar alınamadı.' });
  }
};

// GET /api/tables/:id - Tek masa getir
const getTableById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT table_id, table_number, status FROM dining_tables WHERE table_id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Masa bulunamadı.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getTableById hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Masa alınamadı.' });
  }
};

// PATCH /api/tables/:id/status - Masa durumunu güncelle (Admin / Manager)
// Body: { "status": "Empty" } veya { "status": "Occupied" }
const updateTableStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status alanı zorunludur.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Geçersiz durum. İzin verilen değerler: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE dining_tables SET status = ? WHERE table_id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Masa bulunamadı.' });
    }
    return res.status(200).json({
      success: true,
      message: `Masa durumu "${status}" olarak güncellendi.`,
      data: { table_id: Number(id), status },
    });
  } catch (error) {
    console.error('updateTableStatus hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Masa durumu güncellenemedi.' });
  }
};

module.exports = { getAllTables, getTableById, updateTableStatus };
