import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Payment from '../mongodb/models/payment.js';
import { createAxiosConfig } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

const parseXeroDate = (dateString) => {
    const match = dateString.match(/\/Date\((\d+)([+-]\d+)?\)\//);
    if (match) {
        const timestamp = parseInt(match[1], 10);
        return new Date(timestamp);
    }
    return null;
};

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
