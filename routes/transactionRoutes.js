import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Issuer } from 'openid-client'
import { createAxiosConfig, genrateToken } from '../helpers/helpers.js';
import Transaction from '../mongodb/models/transaction.js';

dotenv.config();

const router = express.Router();

/**
 * Parses a date string from Xero's date format.
 *
 * @param {string} dateString - The date string to be parsed.
 * @returns {Date|null} - Returns a Date object if parsing is successful, 
 *                        or null if the input format is incorrect.
 */
function parseXeroDate(dateString) {
    const match = dateString.match(/\/Date\((\d+)\+\d{4}\)\//);
    return match ? new Date(parseInt(match[1])) : null;
}

/**
 * Retrieves transactions based on provided filters.
 *
 * @route GET /
 * @param {string} status - The status of the transaction to filter by.
 * @param {string} type - The type of the transaction to filter by.
 * @param {string} start_date - The start date for filtering transactions.
 * @param {string} end_date - The end date for filtering transactions.
 * @returns {Object} 200 - An object containing the success flag, message, and transaction data.
 * @returns {Object} 500 - An object containing the success flag and error message for server errors.
 */
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
        query.Date = {};
        
        if (start_date) {
            const parsedStartDate = new Date(start_date);
            if (!isNaN(parsedStartDate.getTime())) {
                query.Date.$gte = parsedStartDate;  
            }
        }
        
        if (end_date) {
            const parsedEndDate = new Date(end_date);
            if (!isNaN(parsedEndDate.getTime())) {
                query.Date.$lte = parsedEndDate;  
            }
        }

        if (Object.keys(query.Date).length === 0) {
            delete query.Date;
        }
    }

    try {
        const transactions = await Transaction.find(query); 
        res.status(200).json({
            status: 200,
            success: true,
            data: transactions,
            message: 'Get all transactions successfully.'
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: 'Something went wrong!'
        });
    }
});


/**
 * Retrieves details of a specific transaction by its ID.
 *
 * @route GET /transaction-detail/{id}
 * @param {string} id.path.required - The ID of the transaction to retrieve.
 * @returns {Object} 200 - An object containing the success flag, message, and transaction data.
 * @returns {Object} 404 - An object indicating that the transaction was not found.
 * @returns {Object} 500 - An object containing the success flag and error message for server errors.
 */
router.get('/transaction-detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findOne({ BankTransactionID: id });
        
        res.status(200).json({status: 200, success: true,  data: transaction, message: 'Get transaction detail successfully.' });
    } catch (err) {
        res.status(500).json({status: 500, success: false, message: err, data:[] });
    }
});

/**
 * Retrieves and processes bank transactions from an external API.
 *
 * @route GET /getAllTransaction
 * @group Transactions - Operations related to transactions
 * @returns {Object} 200 - An object containing the success flag, message, and transaction data.
 * @returns {Object} 400 - An object indicating invalid data format.
 * @returns {Object} 500 - An object containing the success flag, error message, code, and empty data for server errors.
 */
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
            }
            res.status(200).json({ status: 200, success: true, data: bankTransactionsData, message: 'Transactions processed successfully' });
        } else {
            res.status(400).json({status: 400, success: false, message: 'Invalid data format' });
        }
    } catch (err) {
        res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
    }
});

/**
 * Retrieves unique bank account details from transactions.
 *
 * @route GET /bankDetails
 * @returns {Object} 200 - An object containing the success flag, message, and unique bank details.
 * @returns {Object} 500 - An object containing the success flag and error message for server errors.
 */
router.get('/bankDetails', async (req, res) => {
    try {
        const transactions = await Transaction.find({}, 'BankAccount');

        const bankDetails = transactions
            .map(transaction => ({
                Name: transaction.BankAccount?.Name,
                AccountID: transaction.BankAccount?.AccountID,
            }))
            .filter(bank => bank.Name && bank.AccountID);

        const uniqueBankDetails = Array.from(
            new Map(bankDetails.map(bank => [bank.AccountID, bank])).values()
        );

        res.status(200).json({ status: 200, success: true, data: uniqueBankDetails, message: 'Bank details fetched successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: 'Something went wrong!' });
    }
});

export default router;
