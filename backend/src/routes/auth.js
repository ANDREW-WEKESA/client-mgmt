import { Hono } from 'hono';

const app = new Hono();

// POST /api/auth/login
app.post('/login', async (c) => {
  const { password } = await c.req.json();
  const correct = c.env.ADMIN_PASSWORD || 'andrew2026';
  if (password !== correct) {
    return c.json({ error: 'Incorrect password' }, 401);
  }
  // Simple token: base64 of timestamp + password hash
  const token = btoa(`andrew:${Date.now()}:${correct}`);
  return c.json({ token });
});

// Middleware to verify token
export function requireAuth(c, next) {
  const auth = c.req.header('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const decoded = atob(token);
    if (!decoded.startsWith('andrew:')) return c.json({ error: 'Unauthorized' }, 401);
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
}

export default app;
