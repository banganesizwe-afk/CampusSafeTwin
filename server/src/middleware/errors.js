export function notFound(req, res) {
  res.status(404).json({ error: 'The requested resource was not found.' });
}

export function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(error);
  if (error?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Only one optional photo may be attached.' });
  }
  res.status(error.status ?? 500).json({
    error: error.expose ? error.message : 'The server could not complete the request.'
  });
}
