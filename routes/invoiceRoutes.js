import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Invoice from '../mongodb/models/invoice.js';
import { createAxiosConfig, parseXmlToArray } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

/**
 * Parses a Xero date string and converts it to a JavaScript Date object.
 *
 * @param {string} dateString - The Xero date string in the format /Date(timestamp)/.
 * @returns {Date|null} - Returns a Date object if parsing is successful; otherwise, returns null.
 */
const parseXeroDate = (dateString) => {
    const timestamp = parseInt(dateString.replace(/\/Date\((\d+)\)\//, '$1'), 10);
    return new Date(timestamp);
};

/**
 * Retrieves invoices based on various query parameters.
 * 
 * This endpoint allows filtering invoices by type, status, line amount type,
 * and date range. It returns a list of invoices that match the criteria.
 * 
 * @route GET /
 * @query {string} [invoice_type] - The type of the invoice (e.g., 'ACCREC', 'ACCPAY').
 * @query {string} [invoice_status] - The status of the invoice (e.g., 'AUTHORISED', 'DRAFT').
 * @query {string} [line_amount_type] - The line amount type (e.g., 'Exclusive', 'Inclusive').
 * @query {string} [start_date] - The start date for filtering invoices.
 * @query {string} [end_date] - The end date for filtering invoices.
 * @returns {Object} - An object containing the status, success flag, data (invoices), and a message.
 */
router.get('/', async (req, res) => {
    const { invoice_type, invoice_status, line_amount_type, start_date, end_date } = req.query;

    let query = {};
    if (invoice_type) {
        query.Type = invoice_type;
    }
    if (invoice_status) {
        query.Status = invoice_status;
    }
    if (line_amount_type) {
        query.LineAmountTypes = line_amount_type;
    }
    if (start_date || end_date) {
        const dateQuery = {};
        if (start_date) {
            const parsedStartDate = new Date(start_date);
            if (!isNaN(parsedStartDate.getTime())) {
                dateQuery.$gte = parsedStartDate;
            } else {
                return res.status(400).json({ status: 400, success: false, message: 'Invalid start date format' });
            }
        }

        if (end_date) {
            const parsedEndDate = new Date(end_date);
            if (!isNaN(parsedEndDate.getTime())) {
                dateQuery.$lte = parsedEndDate; 
            } else {
                return res.status(400).json({ status: 400, success: false, message: 'Invalid end date format' });
            }
        }

        query.Date = dateQuery;
    }

    try {
        const invoices = await Invoice.find(query).sort({ Date: -1 });
        res.status(200).json({
            status: 200,
            success: true,
            data: invoices,
            message: 'Get all invoices successfully.'
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: 'Something went wrong!'
        });
    }
});


// router.get('/getAllInvoices', async (req, res) => {
//     try {
//         const config = createAxiosConfig(
//             'get',
//             'Invoices',
//         );

//         const response = await axios.request(config);
//         const invoicesData = response.data;
    
//         if (!invoicesData || !Array.isArray(invoicesData.Invoices)) {
//             throw new Error('Invalid data format: Invoices should be an array');
//         }

//         const existingInvoices = await Invoice.find({});
//         const existingInvoiceIDs = new Set(existingInvoices.map(invoice => invoice.InvoiceID));

//         const newInvoices = invoicesData.Invoices
//             .filter(invoice => invoice.InvoiceID && !existingInvoiceIDs.has(invoice.InvoiceID))
//             .map(invoice => ({
//                 ...invoice,
//                 date: parseXeroDate(invoice.Date),
//                 dueDate: parseXeroDate(invoice.DueDate),
//                 updatedDateUTC: parseXeroDate(invoice.UpdatedDateUTC),
//             }));
    
//         if (newInvoices.length > 0) {
//             await Invoice.insertMany(newInvoices);
//             res.status(200).json({ status: 200, success: true, data: invoicesData, message: 'Invoices processed successfully.' });
//         } else {
//             res.status(200).json({ status: 200, success: true, data: invoicesData, message: 'No new invoices to save' });
//         }
//     } catch (err) {
//         res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
//     }
// });

/**
 * Syncs and retrieves all invoices from an external source.
 * 
 * @function syncGetAllInvoices
 * @returns {Promise<void>} - A promise that resolves when the sync operation is complete.
 * @throws {Error} Throws an error if the data format is invalid or if an error occurs during syncing.
 */
async function syncGetAllInvoices() {
    try {
        const config = createAxiosConfig(
            'get',
            'Invoices',
        );
        const response = await axios.request(config);

        const invoicesData = response.data;
        if (!invoicesData || !Array.isArray(invoicesData.Invoices)) {
            throw new Error('Invalid data format: Invoices should be an array');
        }

        const existingInvoices = await Invoice.find({});
        const existingInvoiceIDs = new Set(existingInvoices.map(invoice => invoice.InvoiceID));

        const newInvoices = invoicesData.Invoices
            .filter(invoice => invoice.InvoiceID && !existingInvoiceIDs.has(invoice.InvoiceID))
            .map(invoice => ({
                ...invoice,
                date: parseXeroDate(invoice.Date),
                dueDate: parseXeroDate(invoice.DueDate),
                updatedDateUTC: parseXeroDate(invoice.UpdatedDateUTC),
            }));

        if (newInvoices.length > 0) {
            await Invoice.insertMany(newInvoices);
        } else {
            console.log('No new invoices to save');
        }
    } catch (err) {
        console.error('Error syncing invoices:', err.message);
    }
}

/**
 * Route handler to sync and retrieve all invoices.
 * 
 * @function getAllInvoices
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
router.get('/getAllInvoices', async (req, res) => {
    try {
        await syncGetAllInvoices();
        res.status(200).json({ status: 200, success: true, message: 'Invoices synced successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: err.message });
    }
});

/**
 * Route handler to get the details of a specific invoice by its ID.
 * 
 * @function getInvoiceDetail
 * @param {Object} req - The request object containing the invoice ID in the parameters.
 * @param {Object} res - The response object used to send the response.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
router.get('/invoice-detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const invoices = await Invoice.findOne({ InvoiceID: id });
        
        res.status(200).json({status: 200, success: true,  data: invoices, message: 'Get transaction detail successfully.' });
    } catch (err) {
        res.status(500).json({status: 500, success: false, message: err, data:[] });
    }
});

setInterval(syncGetAllInvoices, 2000);

export default router;