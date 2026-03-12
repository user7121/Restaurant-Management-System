// controllers/productController.js
// Ürün CRUD işlemleri - Sadece Admin yetkisi

const pool = require('../config/db');

// GET /api/products - Tüm ürünleri listele (herkese açık, token gerekli)
const getAllProducts = async (req, res) => {
  try {
    const sql = `
      SELECT
        p.product_id,
        p.name,
        p.price,
        p.stock_quantity,
        c.category_id,
        c.category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.category_id
      ORDER BY c.category_name ASC, p.name ASC
    `;
    const [rows] = await pool.execute(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllProducts hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Ürünler alınamadı.' });
  }
};

// GET /api/products/:id - Tek ürün getir
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT p.product_id, p.name, p.price, p.stock_quantity,
              c.category_id, c.category_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getProductById hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Ürün alınamadı.' });
  }
};

// POST /api/products - Yeni ürün ekle (Admin)
const createProduct = async (req, res) => {
  const { category_id, name, price, stock_quantity } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({
      success: false,
      message: 'category_id, name ve price alanları zorunludur.',
    });
  }
  if (parseFloat(price) < 0) {
    return res.status(400).json({ success: false, message: 'Fiyat negatif olamaz.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO products (category_id, name, price, stock_quantity) VALUES (?, ?, ?, ?)',
      [category_id, name.trim(), price, stock_quantity ?? 0]
    );
    return res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu.',
      data: {
        product_id: result.insertId,
        category_id,
        name: name.trim(),
        price,
        stock_quantity: stock_quantity ?? 0,
      },
    });
  } catch (error) {
    console.error('createProduct hatası:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Geçersiz category_id.' });
    }
    return res.status(500).json({ success: false, message: 'Ürün oluşturulamadı.' });
  }
};

// PUT /api/products/:id - Ürün güncelle (Admin)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, price, stock_quantity } = req.body;

  // En az bir alan güncellenmeliyse
  if (!category_id && !name && price === undefined && stock_quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Güncellenecek en az bir alan gönderilmelidir.',
    });
  }

  try {
    // Önce mevcut veriyi al
    const [existing] = await pool.execute(
      'SELECT * FROM products WHERE product_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }

    const current = existing[0];
    const updatedCategoryId   = category_id    ?? current.category_id;
    const updatedName         = name           ? name.trim() : current.name;
    const updatedPrice        = price          ?? current.price;
    const updatedStock        = stock_quantity ?? current.stock_quantity;

    await pool.execute(
      `UPDATE products
       SET category_id = ?, name = ?, price = ?, stock_quantity = ?
       WHERE product_id = ?`,
      [updatedCategoryId, updatedName, updatedPrice, updatedStock, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Ürün güncellendi.',
      data: {
        product_id: Number(id),
        category_id: updatedCategoryId,
        name: updatedName,
        price: updatedPrice,
        stock_quantity: updatedStock,
      },
    });
  } catch (error) {
    console.error('updateProduct hatası:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Geçersiz category_id.' });
    }
    return res.status(500).json({ success: false, message: 'Ürün güncellenemedi.' });
  }
};

// DELETE /api/products/:id - Ürün sil (Admin)
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE product_id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }
    return res.status(200).json({ success: true, message: 'Ürün silindi.' });
  } catch (error) {
    console.error('deleteProduct hatası:', error.message);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Bu ürün mevcut siparişlerde yer alıyor. Silinemez.',
      });
    }
    return res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
