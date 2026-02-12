// Generic error handler with minimal leak of internal details
export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  const status = err.statusCode || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Error";

  res.status(status).json({
    status: "error",
    message,
    requestId: req.id || undefined,
  });
}


