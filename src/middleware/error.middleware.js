import multer from 'multer';

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found.`,
    availableEndpoints: [
      'POST /api/analyze (Analyze text or screenshot)',
      'GET /api/feed (Get trending scams and community intelligence)',
      'GET /api/feed/stats (Get aggregated scam statistics)',
      'POST /api/feed/report (Submit user community report)',
      'POST /api/feed/upvote/:id (Upvote a scam report)',
      'GET /api/health (Server health & service status)',
    ],
  });
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Screenshot file too large. Maximum allowed size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
