import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Issuer } from 'openid-client'
import { createAxiosConfig, genrateToken } from '../helpers/helpers.js';
import Transaction from '../mongodb/models/transaction.js';

dotenv.config();

const router = express.Router();

function parseXeroDate(dateString) {
    const match = dateString.match(/\/Date\((\d+)\+\d{4}\)\//);
    return match ? new Date(parseInt(match[1])) : null;
}

router.get('/', async (req, res) => {
    const { status, type, start_date, end_date } = req.query;

    let query = {};
    if (status) {
        query.Status = status;
    }
    if (type) {
        query.Type = type;
    }

    if (start_date || end_date) {
        const dateQuery = {};

        if (start_date) {
            const parsedStartDate = new Date(start_date);
            if (!isNaN(parsedStartDate.getTime())) {
                dateQuery.$gt = parsedStartDate;
            }
        }
        if (end_date) {
            const parsedEndDate = new Date(end_date);
            if (!isNaN(parsedEndDate.getTime())) {
                dateQuery.$lt = parsedEndDate;
            }
        }

        query.Date = dateQuery;
    }

    try {
        const transactions = await Transaction.find({query});
        res.status(200).json({status: 200, success: true,  data: transactions, message: 'Get all transactions successfully.' });
    } catch (err) {
        res.status(500).json({status: 500, success: false, message: 'Something went wrong!' });
    }
});

router.get('/transaction-detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);
        res.status(200).json({status: 200, success: true,  data: transaction, message: 'Get transaction detail successfully.' });
    } catch (err) {
        res.status(500).json({status: 500, success: false, message: err, data:[] });
    }
});

router.get('/getAllTransaction', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'BankTransactions',
        );

        const response = await axios.request(config);

        const bankTransactionsData = response.data;

        if (Array.isArray(bankTransactionsData.BankTransactions)) {
            const existingTransactions = await Transaction.find({});
            const existingTransactionIDs = new Set(existingTransactions.map(transaction => transaction.TransactionID));

            const newTransactions = bankTransactionsData.BankTransactions.filter(transaction => !existingTransactionIDs.has(transaction.TransactionID)).map(transaction => ({
                ...transaction,
                Date: parseXeroDate(transaction.Date),
                UpdatedDateUTC: parseXeroDate(transaction.UpdatedDateUTC)
            }));

            if (newTransactions.length > 0) {
                await Transaction.insertMany(newTransactions);
            } else {
            }
            res.status(200).json({ status: 200, success: true, data: bankTransactionsData, message: 'Transactions processed successfully' });
        } else {
            res.status(400).json({status: 400, success: false, message: 'Invalid data format' });
        }
    } catch (err) {
        res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
    }
});


export default router;
