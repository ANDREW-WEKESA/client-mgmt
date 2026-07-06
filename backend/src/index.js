import { Hono } from 'hono';
import { cors } from 'hono/cors';
import clients from './routes/clients.js';
import auth from './routes/auth.js';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowHeaders: ['Content-Type','Authorization'],
}));

app.route('/api/auth', auth);
app.route('/api/clients', clients);

app.get('/', c => c.json({ status: 'Client Management API', version: '1.0' }));

export default app;
