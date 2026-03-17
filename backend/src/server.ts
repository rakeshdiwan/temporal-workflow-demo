import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ordersRouter from './routes/orders';
import workflowsRouter from './routes/workflows';
import swaggerRouter from './swagger/openapi';

const app = express();

app.set('etag', false);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/orders', ordersRouter);
app.use('/workflows', workflowsRouter);
app.use('/api', swaggerRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});

