import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Account from '../mongodb/models/account.js';
import { createAxiosConfig, parseXmlToArray } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

function parseXeroDate(xeroDateString) {
    const timestampMatch = xeroDateString.match(/\/Date\((\d+)\+\d+\)\//);
    if (timestampMatch && timestampMatch[1]) {
        return new Date(parseInt(timestampMatch[1], 10));
    }
    return null;
}

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

router.get('/syncAllAccounts', async (req, res) => {
    try {
        await syncGetAllAccounts();
        res.status(200).json({ status: 200, success: true, message: 'Accounts synced successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: err.message });
    }
});

setInterval(syncGetAllAccounts, 2000); // Sync every 2 seconds

export default router;