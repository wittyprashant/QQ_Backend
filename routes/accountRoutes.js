import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Account from '../mongodb/models/account.js';
import { createAxiosConfig, parseXmlToArray } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

/**
 * Parses a Xero date string and returns a JavaScript Date object.
 * 
 * @param {string} xeroDateString - The date string in Xero format (e.g., "/Date(1627884000000+0000)/").
 * @returns {Date|null} The parsed Date object or null if the input is invalid.
 */
function parseXeroDate(xeroDateString) {
    const timestampMatch = xeroDateString.match(/\/Date\((\d+)\+\d+\)\//);
    if (timestampMatch && timestampMatch[1]) {
        return new Date(parseInt(timestampMatch[1], 10));
    }
    return null;
}

/**
 * @route GET /
 * @group Accounts - Operations related to accounts
 * @param {string} [account_status] - Filter accounts by status
 * @param {string} [account_type] - Filter accounts by type
 * @param {string} [account_class] - Filter accounts by class
 * @param {string} [start_date] - Filter accounts updated after this date (format: ISO 8601)
 * @param {string} [end_date] - Filter accounts updated before this date (format: ISO 8601)
 * @returns {object} 200 - An object containing the status, success flag, and account data
 * @returns {object} 400 - An error object if the date format is invalid
 * @returns {object} 500 - An error object if there is a server error
 * 
 */
router.get('/', async (req, res) => {
    const { account_status, account_type, account_class, start_date, end_date } = req.query;

    let query = {};
    if (account_status) {
        query.Status = account_status;
    }
    if (account_type) {
        query.Type = account_type;
    }
    if (account_class) {
        query.Class = account_class;
    }

    if (start_date || end_date) {
        const dateQuery = {};

        if (start_date) {
            const parsedStartDate = new Date(start_date);
            if (!isNaN(parsedStartDate.getTime())) {
                dateQuery.$gt = parsedStartDate;
            } else {
                return res.status(400).json({ status: 400, success: false, message: 'Invalid start date format' });
            }
        }
        if (end_date) {
            const parsedEndDate = new Date(end_date);
            if (!isNaN(parsedEndDate.getTime())) {
                dateQuery.$lt = parsedEndDate;
            } else {
                return res.status(400).json({ status: 400, success: false, message: 'Invalid end date format' });
            }
        }

        query.UpdatedDateUTC = dateQuery;
    }

    try {
        const accounts = await Account.find(query).sort({ UpdatedDateUTC: -1 });
        res.status(200).json({ status: 200, success: true, data: accounts, message: 'Get all accounts successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: 'Something went wrong!' });
    }
});


/**
 * Syncs all accounts from an external API and saves new accounts to the database.
 *
 * @async
 * @function syncGetAllAccounts
 * @returns {Promise<void>} 
 * @throws {Error} If the API response is invalid or if there is an error during the syncing process.
 */
async function syncGetAllAccounts() {
    try {
        const config = createAxiosConfig(
            'get',
            'Accounts',
        );
        const response = await axios.request(config);

        const accountsData = response.data;
        if (!accountsData || !Array.isArray(accountsData.Accounts)) {
            throw new Error('Invalid data format: Accounts should be an array');
        }

        const existingAccounts = await Account.find({});
        const existingAccountIDs = new Set(existingAccounts.map(account => account.AccountID));

        const newAccounts = accountsData.Accounts
            .filter(account => account.AccountID && !existingAccountIDs.has(account.AccountID))
            .map(account => ({
                ...account,
                updatedDateUTC: parseXeroDate(account.UpdatedDateUTC),
            }));

        if (newAccounts.length > 0) {
            await Account.insertMany(newAccounts);
        } else {
            console.log('No new accounts to save');
        }
    } catch (err) {
        console.error('Error syncing accounts:', err.message);
    }
}

/**
 * @route GET /syncAllAccounts
 * @group Accounts - Operations related to accounts
 * @returns {object} 200 - Accounts synced successfully
 * @returns {object} 500 - Error message if syncing accounts fails
 * @throws {Error} - Returns an error message if there is an issue syncing accounts
 */
router.get('/syncAllAccounts', async (req, res) => {
    try {
        await syncGetAllAccounts();
        res.status(200).json({ status: 200, success: true, message: 'Accounts synced successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: err.message });
    }
});

setInterval(syncGetAllAccounts, 2000);

export default router;