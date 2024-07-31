import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Issuer } from 'openid-client'
import { createAxiosConfig } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

router.get('/getAllInvoices', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'Invoices',
        );

        const response = await axios.request(config);
        console.log(response);
        return false;
        // const bankTransactionsData = response.data;

    } catch (err) {
        res.status(500).json({ success: 'false', message: err.message, code: err.code, data: []});
    }
});


export default router;
