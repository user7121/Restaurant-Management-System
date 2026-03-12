// middlewares/authMiddleware.js
// BLOK 4: Token doğrulama ve rol tabanlı yetkilendirme middleware'leri

const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// verifyToken
// Authorization: Bearer <token> header'ını doğrular.
// Geçerliyse payload'ı req.user'a yazar ve bir sonraki middleware'e geçer.
// ─────────────────────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Erişim reddedildi. Yetkilendirme token\'ı bulunamadı.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, role_name, username }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkRole
// İzin verilen rollerin bir dizisini parametre olarak alır.
// Örnek kullanım: checkRole(['Admin']) veya checkRole(['Admin', 'Manager'])
// verifyToken middleware'inden sonra kullanılmalıdır.
// ─────────────────────────────────────────────────────────────────────────────
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.status(403).json({
        success: false,
        message: 'Yetersiz yetki. Rol bilgisi bulunamadı.',
      });
    }

    const hasPermission = allowedRoles.includes(req.user.role_name);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Erişim reddedildi. Bu işlem için gereken rol(ler): ${allowedRoles.join(', ')}. Mevcut rolünüz: ${req.user.role_name}.`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };
