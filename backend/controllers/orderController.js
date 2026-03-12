// controllers/orderController.js
// Sipariş işleme - Transaction + stok düşürme + rollback

const pool = require('../config/db');

const VALID_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders - Yeni sipariş oluştur
// Body: { table_id, items: [{ product_id, quantity }] }
// İşlem adımları (Transaction):
//   1. Ürünleri stok ve fiyat için doğrula
//   2. orders tablosuna ana kaydı ekle
//   3. Her ürün için order_items tablosuna kayıt ekle
//   4. Her ürünün stock_quantity değerini düşür
//   5. Masayı "Occupied" yap
//   Herhangi bir adımda hata → ROLLBACK
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  const { table_id, items } = req.body;
  const user_id = req.user.user_id; // verifyToken middleware'inden gelir

  // ── Temel doğrulama ───────────────────────────────────────────────────────
  if (!table_id) {
    return res.status(400).json({ success: false, message: 'table_id zorunludur.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'items dizisi en az bir ürün içermelidir.',
    });
  }
  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Her kalem için geçerli product_id ve quantity (>= 1) gereklidir.',
      });
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ── Adım 1: Ürünleri doğrula (stok ve fiyat kontrolü) ─────────────────
    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map(() => '?').join(', ');
    const [products] = await connection.execute(
      `SELECT product_id, name, price, stock_quantity FROM products WHERE product_id IN (${placeholders})`,
      productIds
    );

    // Tüm ürünler bulundu mu?
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.product_id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Şu ürün ID'leri bulunamadı: ${missingIds.join(', ')}`,
      });
    }

    // Stok kontrolü ve toplam tutar hesapla
    const productMap = {};
    products.forEach((p) => { productMap[p.product_id] = p; });

    let total_amount = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `"${product.name}" ürününde yetersiz stok. Mevcut: ${product.stock_quantity}, İstenen: ${item.quantity}`,
        });
      }
      total_amount += parseFloat(product.price) * item.quantity;
    }

    // ── Adım 2: orders tablosuna ana sipariş kaydını ekle ─────────────────
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (table_id, user_id, total_amount, status)
       VALUES (?, ?, ?, 'Pending')`,
      [table_id, user_id, total_amount.toFixed(2)]
    );
    const newOrderId = orderResult.insertId;

    // ── Adım 3: Her kalem için order_items kaydı ekle ─────────────────────
    for (const item of items) {
      const product = productMap[item.product_id];
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [newOrderId, item.product_id, item.quantity, product.price]
      );
    }

    // ── Adım 4: Stok miktarlarını düşür ───────────────────────────────────
    for (const item of items) {
      await connection.execute(
        `UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // ── Adım 5: Masayı "Occupied" yap ─────────────────────────────────────
    await connection.execute(
      `UPDATE dining_tables SET status = 'Occupied' WHERE table_id = ?`,
      [table_id]
    );

    // ── Transaction'ı onayla ──────────────────────────────────────────────
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu.',
      data: {
        order_id: newOrderId,
        table_id,
        user_id,
        total_amount: parseFloat(total_amount.toFixed(2)),
        status: 'Pending',
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: productMap[item.product_id].name,
          quantity: item.quantity,
          unit_price: parseFloat(productMap[item.product_id].price),
        })),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('createOrder hatası:', error.message);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz table_id veya product_id.',
      });
    }
    return res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı.' });
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders - Tüm siparişleri listele (Admin / Manager)
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const sql = `
      SELECT
        o.order_id,
        o.total_amount,
        o.status,
        o.created_at,
        dt.table_number,
        u.first_name,
        u.last_name
      FROM orders o
      INNER JOIN dining_tables dt ON o.table_id = dt.table_id
      INNER JOIN users u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
    `;
    const [rows] = await pool.execute(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllOrders hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id - Sipariş detayı (kalemler dahil)
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    // Ana sipariş bilgisi
    const [orderRows] = await pool.execute(
      `SELECT o.order_id, o.total_amount, o.status, o.created_at,
              dt.table_id, dt.table_number,
              u.user_id, u.first_name, u.last_name
       FROM orders o
       INNER JOIN dining_tables dt ON o.table_id = dt.table_id
       INNER JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ?`,
      [id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
    }

    // Sipariş kalemleri
    const [itemRows] = await pool.execute(
      `SELECT oi.order_item_id, oi.quantity, oi.unit_price,
              p.product_id, p.name AS product_name
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: { ...orderRows[0], items: itemRows },
    });
  } catch (error) {
    console.error('getOrderById hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Sipariş alınamadı.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status - Sipariş durumunu güncelle (Admin / Manager)
// Body: { "status": "Delivered" }
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status alanı zorunludur.' });
  }
  if (!VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Geçersiz durum. İzin verilen değerler: ${VALID_ORDER_STATUSES.join(', ')}`,
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
    }

    // Sipariş teslim edildi veya iptal edildi → masayı boşalt
    if (status === 'Delivered' || status === 'Cancelled') {
      const [orderRows] = await connection.execute(
        'SELECT table_id FROM orders WHERE order_id = ?',
        [id]
      );
      if (orderRows.length > 0) {
        await connection.execute(
          `UPDATE dining_tables SET status = 'Empty' WHERE table_id = ?`,
          [orderRows[0].table_id]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Sipariş durumu "${status}" olarak güncellendi.`,
      data: { order_id: Number(id), status },
    });
  } catch (error) {
    await connection.rollback();
    console.error('updateOrderStatus hatası:', error.message);
    return res.status(500).json({ success: false, message: 'Sipariş durumu güncellenemedi.' });
  } finally {
    connection.release();
  }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus };
