import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { TokenSet } from 'openid-client';
import { XeroClient } from 'xero-node';

dotenv.config();

const router = express.Router();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
const scopes = process.env.SCOPES;

let inMemoryToken;

const xero = new XeroClient({
	clientId: client_id,
	clientSecret: client_secret,
	redirectUris: redirectUrl,
	scopes: scopes.split(' '),
});

router.post('/connect', async (req, res) => {
    return false;
  try {
    const consentUrl = await xero.buildConsentUrl();
    const consentUrl123 = await xero.getClientCredentialsToken();
    res.status(200).json({ success: true, data: consentUrl, message: 'Success' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  }
});

router.get('/callback', async (req, res) => {
    try {
        client.CLOCK_TOLERANCE = 5;
        Issuer.defaultHttpOptions = { timeout: 20000 };
        const token = await xero.apiCallback('https://login.xero.com/identity/connect/authorize?client_id=E318F37F9EF743C09FB820110F9EC40F&scope=openid%20profile%20email%20accounting.settings%20accounting.reports.read%20accounting.journals.read%20accounting.contacts%20accounting.attachments%20accounting.transactions%20offline_access&response_type=code&redirect_uri=http://localhost:8080/callback');
       
        inMemoryToken = token;
        req.session.accessToken = token.access_token;
        req.session.idToken = token.id_token;
        req.session.refreshToken = token.refresh_token;
        req.session.save();

        const connectionsRequestOptions = {
            url: 'https://api.xero.com/connections',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            auth: {
                'bearer': req.session.accessToken
            },
            timeout: 10000,
            maxBodyLength: Infinity
        };

        request.get(connectionsRequestOptions, (error, response, body) => {
            if (error) {
                console.log('error from connectionsRequest: ' + error);
            }
            let data = JSON.parse(body);
            let tenant = data[0];
            req.session.xeroTenantId = tenant.tenantId;
            req.session.save();
        });
    } catch (e) {
        console.log('ERROR: ' + e);
    } finally {
        res.redirect('/home');
    }
});

export default router;