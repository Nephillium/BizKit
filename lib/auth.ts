export function getCallbackUrl(req: { headers: { host?: string }; url?: string }) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.host || 'localhost:5000';
  return `${protocol}://${host}/api/callback`;
}

export function getBaseUrl(req: { headers: { host?: string } }) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.host || 'localhost:5000';
  return `${protocol}://${host}`;
}
