// controllers/categoryController.js
// Category CRUD — Admin only
// Inheritance: extends BaseController
// Polymorphism: overrides handleError for dup-entry & FK-reference errors

const BaseController = require('./BaseController');

class CategoryController extends BaseController {
  // ── Polymorphic error handler ───────────────────────────────────────────
  handleError(res, error, context = 'category operation') {
    console.error(`${context} error:`, error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return this.fail(res, 'This category name already exists.', 409);
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return this.fail(res, 'This category has products attached. Please delete or reassign the products first.', 409);
    }
    return this.fail(res, `Failed to complete ${context}.`, 500);
  }

  // ── GET /api/categories ─────────────────────────────────────────────────
  async getAll(req, res) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT category_id, category_name FROM categories ORDER BY category_name ASC'
      );
      return this.success(res, rows);
    } catch (error) {
      return this.handleError(res, error, 'getAllCategories');
    }
  }

  // ── POST /api/categories ────────────────────────────────────────────────
  async create(req, res) {
    const { category_name } = req.body;
    if (!category_name || category_name.trim() === '') {
      return this.fail(res, 'Category name is required.');
    }
    try {
      const [result] = await this.pool.execute(
        'INSERT INTO categories (category_name) VALUES (?)',
        [category_name.trim()]
      );
      return this.success(res, {
        category_id: result.insertId, category_name: category_name.trim(),
      }, 201, 'Category created successfully.');
    } catch (error) {
      return this.handleError(res, error, 'createCategory');
    }
  }

  // ── PUT /api/categories/:id ─────────────────────────────────────────────
  async update(req, res) {
    const { id } = req.params;
    const { category_name } = req.body;
    if (!category_name || category_name.trim() === '') {
      return this.fail(res, 'Category name is required.');
    }
    try {
      const [result] = await this.pool.execute(
        'UPDATE categories SET category_name = ? WHERE category_id = ?',
        [category_name.trim(), id]
      );
      if (result.affectedRows === 0) {
        return this.fail(res, 'Category not found.', 404);
      }
      return this.success(res, {
        category_id: Number(id), category_name: category_name.trim(),
      }, 200, 'Category updated.');
    } catch (error) {
      return this.handleError(res, error, 'updateCategory');
    }
  }

  // ── DELETE /api/categories/:id ──────────────────────────────────────────
  async delete(req, res) {
    const { id } = req.params;
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM categories WHERE category_id = ?', [id]
      );
      if (result.affectedRows === 0) {
        return this.fail(res, 'Category not found.', 404);
      }
      return this.success(res, undefined, 200, 'Category deleted.');
    } catch (error) {
      return this.handleError(res, error, 'deleteCategory');
    }
  }
}

module.exports = new CategoryController();
