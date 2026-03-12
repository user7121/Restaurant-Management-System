// controllers/categoryController.js
// Kategori CRUD işlemleri - Sadece Admin yetkisi

const pool = require('../config/db');

// GET /api/categories - Tüm kategorileri listele
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT category_id, category_name FROM categories ORDER BY category_name ASC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllCategories hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Kategoriler alınamadı.' });
  }
};

// POST /api/categories - Yeni kategori ekle (Admin)
const createCategory = async (req, res) => {
  const { category_name } = req.body;
  if (!category_name || category_name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Kategori adı zorunludur.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (category_name) VALUES (?)',
      [category_name.trim()]
    );
    return res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu.',
      data: { category_id: result.insertId, category_name: category_name.trim() },
    });
  } catch (error) {
    console.error('createCategory hatası:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Bu kategori adı zaten mevcut.' });
    }
    return res.status(500).json({ success: false, message: 'Kategori oluşturulamadı.' });
  }
};

// PUT /api/categories/:id - Kategori güncelle (Admin)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  if (!category_name || category_name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Kategori adı zorunludur.' });
  }
  try {
    const [result] = await pool.execute(
      'UPDATE categories SET category_name = ? WHERE category_id = ?',
      [category_name.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori bulunamadı.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Kategori güncellendi.',
      data: { category_id: Number(id), category_name: category_name.trim() },
    });
  } catch (error) {
    console.error('updateCategory hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Kategori güncellenemedi.' });
  }
};

// DELETE /api/categories/:id - Kategori sil (Admin)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE category_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori bulunamadı.' });
    }
    return res.status(200).json({ success: true, message: 'Kategori silindi.' });
  } catch (error) {
    console.error('deleteCategory hatası:', error.message);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Bu kategoriye ait ürünler mevcut. Önce ürünleri silin veya taşıyın.',
      });
    }
    return res.status(500).json({ success: false, message: 'Kategori silinemedi.' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
