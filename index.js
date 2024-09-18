import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './mongodb/connect.js';
import dalleRoutes from './routes/dalleRoutes.js';
import roleRoutes from  './routes/roleRoutes.js';
import userRoutes from  './routes/userRoutes.js';
import xeroRoutes from  './routes/xeroRoutes.js';
import transactionRoutes from  './routes/transactionRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '9999mb' }));

app.use('/api/v1/dalle', dalleRoutes);
app.use('/api/v1/role', roleRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/xero', xeroRoutes);
app.use('/api/v1/transaction', transactionRoutes);
app.use('/api/v1/invoice', invoiceRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/payment',paymentRoutes);
app.use('/api/v1/purchaseOrder', purchaseOrderRoutes);
app.use('/api/v1/account', accountRoutes);

app.get('/', async (req, res) => {
  res.status(200).json({
    message: 'Hello from DALL.E!',
  });
});

const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_URL);
    app.listen(8080, () => console.log('Server started on port 8080'));
  } catch (error) {
    console.log(error);
  }
};

startServer();
