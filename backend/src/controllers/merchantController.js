
const pool = require("../config/db");

const getActiveMerchants = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          id,
          business_name
       FROM merchants
       WHERE status = 'active'
       ORDER BY business_name ASC`
    );

    return res.status(200).json({
      success: true,
      merchants: result.rows,
    });
  } catch (error) {
    console.error("Get active merchants error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve merchants",
    });
  }
};

module.exports = {
  getActiveMerchants,
};

