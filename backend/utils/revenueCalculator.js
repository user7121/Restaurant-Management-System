/**
 * Revenue Calculator Utility Module
 * Provides revenue calculation and analysis logic for sales reports
 */

class RevenueCalculator {
  /**
   * Calculate total revenue from orders
   * @param {Array} orders - Array of order objects
   * @returns {number} Total revenue
   */
  static calculateTotalRevenue(orders) {
    if (!Array.isArray(orders)) return 0;
    return orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
  }

  /**
   * Calculate average order value
   * @param {Array} orders - Array of order objects
   * @returns {number} Average order value
   */
  static calculateAverageOrderValue(orders) {
    if (!Array.isArray(orders) || orders.length === 0) return 0;
    return this.calculateTotalRevenue(orders) / orders.length;
  }

  /**
   * Calculate revenue by category
   * @param {Array} orderItems - Array of order items with product info
   * @returns {Object} Revenue breakdown by category
   */
  static calculateRevenueByCategory(orderItems) {
    if (!Array.isArray(orderItems)) return {};

    return orderItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      const revenue = parseFloat(item.price) * parseInt(item.quantity) || 0;

      if (!acc[category]) {
        acc[category] = {
          category,
          total_revenue: 0,
          quantity_sold: 0,
          items_count: 0,
        };
      }

      acc[category].total_revenue += revenue;
      acc[category].quantity_sold += parseInt(item.quantity) || 0;
      acc[category].items_count += 1;

      return acc;
    }, {});
  }

  /**
   * Calculate revenue by payment method
   * @param {Array} orders - Array of order objects
   * @returns {Object} Revenue breakdown by payment method
   */
  static calculateRevenueByPaymentMethod(orders) {
    if (!Array.isArray(orders)) return {};

    return orders.reduce((acc, order) => {
      const paymentMethod = order.payment_method || 'Unknown';
      const revenue = parseFloat(order.total_amount) || 0;

      if (!acc[paymentMethod]) {
        acc[paymentMethod] = {
          payment_method: paymentMethod,
          total_revenue: 0,
          transaction_count: 0,
          average_transaction: 0,
        };
      }

      acc[paymentMethod].total_revenue += revenue;
      acc[paymentMethod].transaction_count += 1;

      return acc;
    }, {});
  }

  /**
   * Calculate top selling products
   * @param {Array} orderItems - Array of order items
   * @param {number} limit - Number of top products to return
   * @returns {Array} Top selling products with sales metrics
   */
  static getTopSellingProducts(orderItems, limit = 10) {
    if (!Array.isArray(orderItems)) return [];

    const productMap = {};

    orderItems.forEach((item) => {
      const productId = item.product_id;
      const revenue = parseFloat(item.price) * parseInt(item.quantity) || 0;

      if (!productMap[productId]) {
        productMap[productId] = {
          product_id: productId,
          product_name: item.product_name || 'Unknown',
          category: item.category || 'Uncategorized',
          quantity_sold: 0,
          total_revenue: 0,
          average_price: 0,
        };
      }

      productMap[productId].quantity_sold += parseInt(item.quantity) || 0;
      productMap[productId].total_revenue += revenue;
    });

    return Object.values(productMap)
      .map((product) => ({
        ...product,
        average_price: product.quantity_sold > 0 ? product.total_revenue / product.quantity_sold : 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  /**
   * Calculate peak hours (time-based revenue analysis)
   * @param {Array} orders - Array of order objects with timestamps
   * @returns {Object} Revenue breakdown by hour
   */
  static calculatePeakHours(orders) {
    if (!Array.isArray(orders)) return {};

    return orders.reduce((acc, order) => {
      if (!order.created_at) return acc;

      const date = new Date(order.created_at);
      const hour = `${String(date.getHours()).padStart(2, '0')}:00`;
      const revenue = parseFloat(order.total_amount) || 0;

      if (!acc[hour]) {
        acc[hour] = {
          hour,
          total_revenue: 0,
          order_count: 0,
        };
      }

      acc[hour].total_revenue += revenue;
      acc[hour].order_count += 1;

      return acc;
    }, {});
  }

  /**
   * Calculate revenue by date range with daily breakdown
   * @param {Array} orders - Array of order objects
   * @returns {Array} Daily revenue breakdown
   */
  static calculateDailyRevenue(orders) {
    if (!Array.isArray(orders)) return [];

    const dailyMap = {};

    orders.forEach((order) => {
      if (!order.created_at) return;

      const date = new Date(order.created_at).toISOString().split('T')[0];
      const revenue = parseFloat(order.total_amount) || 0;

      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          total_revenue: 0,
          order_count: 0,
          average_order_value: 0,
        };
      }

      dailyMap[date].total_revenue += revenue;
      dailyMap[date].order_count += 1;
    });

    return Object.values(dailyMap)
      .map((day) => ({
        ...day,
        average_order_value: day.order_count > 0 ? day.total_revenue / day.order_count : 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Calculate gross profit (requires cost data)
   * @param {number} totalRevenue - Total revenue
   * @param {number} totalCost - Total cost of goods sold
   * @returns {Object} Profit metrics
   */
  static calculateProfit(totalRevenue, totalCost) {
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      gross_profit: grossProfit,
      profit_margin_percentage: parseFloat(profitMargin.toFixed(2)),
    };
  }

  /**
   * Generate comprehensive revenue report
   * @param {Array} orders - Array of order objects
   * @param {Array} orderItems - Array of order items
   * @returns {Object} Comprehensive revenue report
   */
  static generateComprehensiveReport(orders, orderItems) {
    const totalRevenue = this.calculateTotalRevenue(orders);
    const averageOrderValue = this.calculateAverageOrderValue(orders);
    const revenueByCategory = this.calculateRevenueByCategory(orderItems);
    const revenueByPayment = this.calculateRevenueByPaymentMethod(orders);
    const topProducts = this.getTopSellingProducts(orderItems, 10);
    const peakHours = this.calculatePeakHours(orders);
    const dailyRevenue = this.calculateDailyRevenue(orders);

    return {
      summary: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_orders: orders.length,
        average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      },
      by_category: Object.values(revenueByCategory),
      by_payment_method: Object.values(revenueByPayment),
      top_products: topProducts,
      peak_hours: Object.values(peakHours).sort((a, b) => b.total_revenue - a.total_revenue),
      daily_breakdown: dailyRevenue,
    };
  }
}

module.exports = RevenueCalculator;
