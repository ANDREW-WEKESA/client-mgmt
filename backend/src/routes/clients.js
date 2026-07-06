import { Hono } from 'hono';
import { requireAuth } from './auth.js';

const app = new Hono();

// POST /api/clients — public, submit new project request
app.post('/', async (c) => {
  const body = await c.req.json();
  const { name, email, phone, company, title, type, description,
          purpose, features, extra_features, timeline, budget,
          existing, notes } = body;

  if (!name || !email || !title || !type || !description || !timeline || !budget) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO clients (id,name,email,phone,company,title,type,description,purpose,
      features,extra_features,timeline,budget,existing,notes,status,quote,dev_notes,submitted,updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'New','','',?,?)
  `).bind(id,name,email,phone||'',company||'',title,type,description,
    purpose||'',features||'',extra_features||'',timeline,budget,
    existing||'',notes||'',now,now).run();

  return c.json({ success: true, id });
});

// GET /api/clients — protected, get all clients
app.get('/', requireAuth, async (c) => {
  const status = c.req.query('status');
  let query = 'SELECT * FROM clients ORDER BY submitted DESC';
  let result;
  if (status && status !== 'All') {
    result = await c.env.DB.prepare('SELECT * FROM clients WHERE status=? ORDER BY submitted DESC').bind(status).all();
  } else {
    result = await c.env.DB.prepare(query).all();
  }
  return c.json(result.results);
});

// GET /api/clients/stats — protected, dashboard stats
app.get('/stats', requireAuth, async (c) => {
  const all = await c.env.DB.prepare('SELECT status FROM clients').all();
  const rows = all.results;
  const stats = {
    total: rows.length,
    new: rows.filter(r=>r.status==='New').length,
    active: rows.filter(r=>['Agreed','In Progress','Review'].includes(r.status)).length,
    paid: rows.filter(r=>r.status==='Paid').length,
    byStatus: {},
  };
  ['New','Quoted','Agreed','In Progress','Review','Delivered','Paid'].forEach(s => {
    stats.byStatus[s] = rows.filter(r=>r.status===s).length;
  });
  return c.json(stats);
});

// GET /api/clients/:id — protected, get one client
app.get('/:id', requireAuth, async (c) => {
  const client = await c.env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(c.req.param('id')).first();
  if (!client) return c.json({ error: 'Not found' }, 404);
  return c.json(client);
});

// PUT /api/clients/:id — protected, update client
app.put('/:id', requireAuth, async (c) => {
  const { status, quote, dev_notes } = await c.req.json();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE clients SET status=?, quote=?, dev_notes=?, updated=? WHERE id=?'
  ).bind(status, quote||'', dev_notes||'', now, c.req.param('id')).run();
  return c.json({ success: true });
});

// DELETE /api/clients/:id — protected, delete client
app.delete('/:id', requireAuth, async (c) => {
  await c.env.DB.prepare('DELETE FROM clients WHERE id=?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
