import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import PurchaseOrder from '../mongodb/models/purchaseOrder.js';
import { createAxiosConfig } from '../helpers/helpers.js';

dotenv.config();

const router = express.Router();

function parseXeroDate(dateString) {
    const timestampMatch = /\/Date\((\d+)\+\d+\)\//.exec(dateString);
    return timestampMatch ? new Date(parseInt(timestampMatch[1], 10)) : null;
}

router.get('/', async (req, res) => {
    const { purchase_order_status, start_date, end_date } = req.query;

    let query = {};
    
    if (purchase_order_status) {
        query.Status = purchase_order_status;
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
        const purchaseOrders = await PurchaseOrder.find(query);
        res.status(200).json({ status: 200, success: true, data: purchaseOrders, message: 'Get all purchase orders successfully.' });
    } catch (err) {
        res.status(500).json({ status: 500, success: false, message: 'Something went wrong!' });
    }
});

router.get('/getAllPurchaseOrder', async (req, res) => {
    try {
        const config = createAxiosConfig(
            'get',
            'PurchaseOrders',
        );

        const response = await axios.request(config);
        const purchaseOrdersData = response.data;

        if (!purchaseOrdersData || !Array.isArray(purchaseOrdersData.PurchaseOrders)) {
            throw new Error('Invalid data format: PurchaseOrders should be an array.');
        }

        const existingPurchaseOrders = await PurchaseOrder.find({});
        const existingPurchaseOrderIDs = new Set(existingPurchaseOrders.map(po => po.PurchaseOrderID));

        const newPurchaseOrders = purchaseOrdersData.PurchaseOrders
            .filter(po => po.PurchaseOrderID && !existingPurchaseOrderIDs.has(po.PurchaseOrderID))
            .map(po => ({
                PurchaseOrderID: po.PurchaseOrderID,
                PurchaseOrderNumber: po.PurchaseOrderNumber,
                DateString: po.DateString,
                // Date: parseXeroDate(po.Date),
                DeliveryDateString: po.DeliveryDateString,
                // DeliveryDate: parseXeroDate(po.DeliveryDate),
                DeliveryAddress: po.DeliveryAddress,
                AttentionTo: po.AttentionTo,
                Telephone: po.Telephone,
                DeliveryInstructions: po.DeliveryInstructions,
                HasErrors: po.HasErrors,
                IsDiscounted: po.IsDiscounted,
                Reference: po.Reference,
                Type: po.Type,
                CurrencyRate: po.CurrencyRate,
                CurrencyCode: po.CurrencyCode,
                Contact: po.Contact ? {
                    ContactID: po.Contact.ContactID,
                    ContactStatus: po.Contact.ContactStatus,
                    Name: po.Contact.Name,
                    FirstName: po.Contact.FirstName,
                    LastName: po.Contact.LastName,
                    Addresses: po.Contact.Addresses,
                    Phones: po.Contact.Phones,
                    DefaultCurrency: po.Contact.DefaultCurrency,
                    HasValidationErrors: po.Contact.HasValidationErrors
                } : null,
                BrandingThemeID: po.BrandingThemeID,
                Status: po.Status,
                LineAmountTypes: po.LineAmountTypes,
                LineItems: po.LineItems.map(item => ({
                    Description: item.Description,
                    UnitAmount: item.UnitAmount,
                    TaxType: item.TaxType,
                    TaxAmount: item.TaxAmount,
                    LineAmount: item.LineAmount,
                    Tracking: item.Tracking,
                    Quantity: item.Quantity,
                    LineItemID: item.LineItemID
                })),
                SubTotal: po.SubTotal,
                TotalTax: po.TotalTax,
                Total: po.Total,
                // UpdatedDateUTC: parseXeroDate(po.UpdatedDateUTC),
                HasAttachments: po.HasAttachments
            }));

        if (newPurchaseOrders.length > 0) {
            await PurchaseOrder.insertMany(newPurchaseOrders);
            res.status(200).json({ status: 200, success: true, data: purchaseOrdersData, message: 'Purchase Orders processed successfully.' });
        } else {
            res.status(200).json({ status: 200, success: true, data: purchaseOrdersData, message: 'No new purchase orders to save' });
        }
    } catch (err) {
        res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
    }
});

export default router;
