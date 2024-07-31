import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import Contact from '../mongodb/models/contact.js';
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
    const { contact_status, start_date, end_date } = req.query;

    let query = {};
    
    if (contact_status) {
        query.ContactStatus = contact_status;
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
        const contacts = await Contact.find(query);
        res.status(200).json({ status: 200, success: true, data: contacts, message: 'Get all contacts successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: 'Something went wrong!' });
    }
});

router.get('/getAllContacts', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'Contacts',
        );

        const response = await axios.request(config);
        const contactsData = response.data;

        if (!contactsData || !Array.isArray(contactsData.Contacts)) {
            throw new Error('Invalid data format: Contacts should be an array.');
        }

        const existingContacts = await Contact.find({});
        const existingContactIDs = new Set(existingContacts.map(contact => contact.ContactID));

        const newContacts = contactsData.Contacts
            .filter(contact => contact.ContactID && !existingContactIDs.has(contact.ContactID))
            .map(contact => ({
                ContactID: contact.ContactID,
                ContactStatus: contact.ContactStatus,
                Name: contact.Name,
                FirstName: contact.FirstName,
                LastName: contact.LastName,
                EmailAddress: contact.EmailAddress,
                BankAccountDetails: contact.BankAccountDetails,
                Addresses: contact.Addresses,
                Phones: contact.Phones,
                UpdatedDateUTC: parseXeroDate(contact.UpdatedDateUTC),
                ContactGroups: contact.ContactGroups,
                IsSupplier: contact.IsSupplier,
                IsCustomer: contact.IsCustomer,
                ContactPersons: contact.ContactPersons,
                HasAttachments: contact.HasAttachments,
                HasValidationErrors: contact.HasValidationErrors,
                Balances: contact.Balances,
                DefaultCurrency: contact.DefaultCurrency,
            }));

        if (newContacts.length > 0) {
            await Contact.insertMany(newContacts);
            res.status(200).json({ status: 200, success: true, data: contactsData, message: 'Contacts processed successfully.' });
        } else {
            res.status(200).json({ status: 200, success: true, data: contactsData, message: 'No new contacts to save' });
        }
    } catch (err) {
        res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
    }
});

export default router;
