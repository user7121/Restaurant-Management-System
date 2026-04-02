// controllers/orderController.js
// Order processing - Transaction + stock deduction + rollback

const pool = require('../config/db');

const VALID_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders - Create a new order
// Body: { table_id, items: [{ product_id, quantity }] }
// Transaction steps:
//   1. Validate products (stock + price)
//   2. Insert main record into orders table
//   3. Insert a row into order_items for each product
//   4. Deduct stock_quantity for each product
//   5. Set table status to "Occupied"
//   Any failure → ROLLBACK
// ─────────────────────────────────────────────────────────────────────────────
async function validateProductsAndGetTotal(connection, items) {
  const productIds = items.map((i) => i.product_id);
  const placeholders = productIds.map(() => '?').join(', ');
  const [products] = await connection.execute(
    `SELECT product_id, name, price, stock_quantity FROM products WHERE product_id IN (${placeholders})`,
    productIds
  );

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p.product_id);
    const missingIds = productIds.filter((id) => !foundIds.includes(id));
    throw new Error(`NOT_FOUND: The following product ID(s) were not found: ${missingIds.join(', ')}`);
  }

  const productMap = {};
  products.forEach((p) => { productMap[p.product_id] = p; });

  let total_amount = 0;
  for (const item of items) {
    const product = productMap[item.product_id];
    if (product.stock_quantity < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK: Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
    }
    total_amount += parseFloat(product.price) * item.quantity;
  }

  return { productMap, total_amount };
}

async function insertOrderAndItems(connection, table_id, user_id, total_amount, items, productMap) {
  const [orderResult] = await connection.execute(
    `INSERT INTO orders (table_id, user_id, total_amount, status) VALUES (?, ?, ?, 'Pending')`,
    [table_id, user_id, total_amount.toFixed(2)]
  );
  const newOrderId = orderResult.insertId;

  for (const item of items) {
    const product = productMap[item.product_id];
    await connection.execute(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
      [newOrderId, item.product_id, item.quantity, product.price]
    );
  }
  return newOrderId;
}

async function deductStockAndOccupyTable(connection, items, user_id, newOrderId, table_id) {
  for (const item of items) {
    await connection.execute(
      `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
      [item.quantity, item.product_id]
    );
    await connection.execute(
      `INSERT INTO stock_movements (product_id, user_id, quantity, reason, reference_id, note) VALUES (?, ?, ?, 'order', ?, ?)`,
      [item.product_id, user_id, -item.quantity, newOrderId, `Order #${newOrderId} placed`]
    );
  }
  await connection.execute(
    `UPDATE dining_tables SET status = 'Occupied' WHERE table_id = ?`,
    [table_id]
  );
}

const createOrder = async (req, res) => {
  const { table_id, items } = req.body;
  const user_id = req.user.user_id;

  if (!table_id) return res.status(400).json({ success: false, message: 'table_id is required.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'items array must contain at least one product.' });
  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity < 1) {
      return res.status(400).json({ success: false, message: 'Each item requires a valid product_id and quantity (>= 1).' });
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { productMap, total_amount } = await validateProductsAndGetTotal(connection, items);
    const newOrderId = await insertOrderAndItems(connection, table_id, user_id, total_amount, items, productMap);
    await deductStockAndOccupyTable(connection, items, user_id, newOrderId, table_id);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
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
    console.error('createOrder error:', error.message);
    if (error.message.startsWith('NOT_FOUND:')) return res.status(404).json({ success: false, message: error.message.replace('NOT_FOUND: ', '') });
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) return res.status(409).json({ success: false, message: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ success: false, message: 'Invalid table_id or product_id.' });
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders - List all orders (Admin / Manager)
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
    console.error('getAllOrders error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id - Get order details (including items)
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    // Main order info
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
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Order items
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
    console.error('getOrderById error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status - Update order status (Admin / Manager)
// Body: { "status": "Delivered" }
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'status field is required.' });
  }
  if (!VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`,
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch current order info (status + table_id)
    const [orderRows] = await connection.execute(
      'SELECT order_id, table_id, status AS current_status FROM orders WHERE order_id = ?',
      [id]
    );
    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const currentOrder = orderRows[0];

    // Prevent re-cancelling or updating already cancelled/delivered orders
    if (currentOrder.current_status === 'Cancelled' || currentOrder.current_status === 'Delivered') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Cannot update status. Order is already "${currentOrder.current_status}".`,
      });
    }

    // Update order status
    await connection.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, id]
    );

    // ── Cancelled → restore stock + log movements ─────────────────────────
    if (status === 'Cancelled') {
      const user_id = req.user.user_id;

      // Get all items of this order
      const [orderItems] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      // Restore stock for each item and log the movement
      for (const item of orderItems) {
        await connection.execute(
          `UPDATE products
           SET stock_quantity = stock_quantity + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );

        await connection.execute(
          `INSERT INTO stock_movements (product_id, user_id, quantity, reason, reference_id, note)
           VALUES (?, ?, ?, 'cancellation', ?, ?)`,
          [item.product_id, user_id, item.quantity, Number(id), `Order #${id} cancelled — stock restored`]
        );
      }
    }

    // Delivered or Cancelled → free the table
    if (status === 'Delivered' || status === 'Cancelled') {
      await connection.execute(
        `UPDATE dining_tables SET status = 'Empty' WHERE table_id = ?`,
        [currentOrder.table_id]
      );
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      data: { order_id: Number(id), status },
    });
  } catch (error) {
    await connection.rollback();
    console.error('updateOrderStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  } finally {
    connection.release();
  }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus };
