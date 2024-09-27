import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Payment from '../mongodb/models/payment.js';
import { createAxiosConfig } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

/**
 * Parses a Xero date string in the format /Date(timestamp±timezone)/ 
 * and converts it to a JavaScript Date object.
 *
 * @param {string} dateString - The Xero date string to parse.
 * @returns {Date|null} - Returns a Date object if parsing is successful; otherwise, returns null.
 */
const parseXeroDate = (dateString) => {
    const match = dateString.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
        const timestamp = parseInt(match[1], 10);
        return new Date(timestamp);
    }
    return null;
};

/**
 * Fetches all payment records based on optional query parameters.
 *
 * @route GET /
 * @query {string} [payment_type] - The type of payment to filter by.
 * @query {string} [status] - The status of the payments to filter by.
 * @query {string} [start_date] - The start date for filtering payments (inclusive).
 * @query {string} [end_date] - The end date for filtering payments (inclusive).
 * @returns {object} 200 - An object containing payment records and a success message.
 * @returns {object} 400 - An error message if the date format is invalid.
 * @returns {object} 500 - An error message if something went wrong during the query.
 */
router.get('/', async (req, res) => {
    const { payment_type, status, start_date, end_date } = req.query;

    let query = {};
    
    if (payment_type) {
        query.PaymentType = payment_type;
    }
    if (status) {
        query.Status = status;
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

        query.UpdatedDateUTC = dateQuery;
    }

    try {
        const payments = await Payment.find(query);
        res.status(200).json({ status: 200, success: true, data: payments, message: 'Get all payments successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: 'Something went wrong!' });
    }
});

/**
 * Retrieves all payments from the external API and saves new payments to the database.
 *
 * @route GET /getAllPayments
 * @returns {object} 200 - An object containing the processed payments data or a message indicating no new payments.
 * @returns {object} 500 - An error message if something went wrong during the API request or database operation.
 */
router.get('/getAllPayments', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'Payments',
        );

        const response = await axios.request(config);
        const paymentsData = response.data;

        if (!paymentsData || !Array.isArray(paymentsData.Payments)) {
            throw new Error('Invalid data format: Payments should be an array.');
        }

        const existingPayments = await Payment.find({});
        const existingPaymentIDs = new Set(existingPayments.map(payment => payment.PaymentID));

        const newPayments = paymentsData.Payments
            .filter(payment => payment.PaymentID && !existingPaymentIDs.has(payment.PaymentID))
            .map(payment => ({
                PaymentID: payment.PaymentID,
                Date: parseXeroDate(payment.Date),
                BankAmount: payment.BankAmount,
                Amount: payment.Amount,
                Reference: payment.Reference,
                CurrencyRate: payment.CurrencyRate,
                PaymentType: payment.PaymentType,
                Status: payment.Status,
                UpdatedDateUTC: parseXeroDate(payment.UpdatedDateUTC),
                HasAccount: payment.HasAccount,
                IsReconciled: payment.IsReconciled,
                Account: {
                    AccountID: payment.Account.AccountID,
                    Code: payment.Account.Code
                },
                Invoice: {
                    Type: payment.Invoice.Type,
                    InvoiceID: payment.Invoice.InvoiceID,
                    InvoiceNumber: payment.Invoice.InvoiceNumber,
                    Payments: payment.Invoice.Payments,
                    CreditNotes: payment.Invoice.CreditNotes,
                    Prepayments: payment.Invoice.Prepayments,
                    Overpayments: payment.Invoice.Overpayments,
                    IsDiscounted: payment.Invoice.IsDiscounted,
                    InvoiceAddresses: payment.Invoice.InvoiceAddresses,
                    HasErrors: payment.Invoice.HasErrors,
                    InvoicePaymentServices: payment.Invoice.InvoicePaymentServices,
                    Contact: {
                        ContactID: payment.Invoice.Contact.ContactID,
                        Name: payment.Invoice.Contact.Name,
                        Addresses: payment.Invoice.Contact.Addresses,
                        Phones: payment.Invoice.Contact.Phones,
                        ContactGroups: payment.Invoice.Contact.ContactGroups,
                        ContactPersons: payment.Invoice.Contact.ContactPersons,
                        HasValidationErrors: payment.Invoice.Contact.HasValidationErrors
                    },
                    LineItems: payment.Invoice.LineItems,
                    CurrencyCode: payment.Invoice.CurrencyCode
                },
                HasValidationErrors: payment.HasValidationErrors
            }));

        if (newPayments.length > 0) {
            await Payment.insertMany(newPayments);
            res.status(200).json({ status: 200, success: true, data: paymentsData, message: 'Payments processed successfully.' });
        } else {
            res.status(200).json({ status: 200, success: true, data: paymentsData, message: 'No new payments to save' });
        }
    } catch (err) {
        res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
    }
});

export default router;
