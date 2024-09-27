import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Issuer } from 'openid-client'
import { createAxiosConfig } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

/**
 * Retrieves all invoices from an external API.
 *
 * @route GET /getAllInvoices
 * @returns {Object} 200 - An object containing the success flag, message, and the invoice data
 * @returns {Object} 500 - An object containing the success flag, error message, code, and empty data for server errors
 */
router.get('/getAllInvoices', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'Invoices',
        );

        const response = await axios.request(config);
        console.log(response);
        return false;
    } catch (err) {
        res.status(500).json({ success: 'false', message: err.message, code: err.code, data: []});
    }
});

export default router;
