import bcrypt from 'bcrypt';
import axios from 'axios';
import xml2js from 'xml2js';

const saltRounds = 10;

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password.toString(), saltRounds, (err, hashedPassword) => {
      if (err) {
        reject(err);
      } else {
        resolve(hashedPassword);
      }
    });
  });
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    const match = await bcrypt.compare(password.toString(), hashedPassword);
    return match;
  } catch (err) {
    throw new Error('Error comparing passwords');
  }
};


export const createAxiosConfig = (method, endPoint, maxBodyLength = Infinity) => {
  return {
    method: method,
    maxBodyLength: maxBodyLength,
    url: process.env.BASE_URL+'/'+endPoint,
    headers: {
      'xero-tenant-id': process.env.TENANT_ID,
      'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };
};

export const genrateToken = () => {
  const data = qs.stringify({ 'grant_type': 'client_credentials' });

  const config = {
    method: 'post',
    url: 'https://identity.xero.com/connect/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authString}`
    },
    data: data
  };

  try {
    const response = axios.request(config);
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

export const parseXmlToArray = async (xmlData) => {
  return new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, { explicitArray: true, mergeAttrs: true }, (err, result) => {
          if (err) {
              reject(err);
          } else {
              // Assuming you want to convert the whole XML object to an array format
              // You can customize this part according to your specific needs
              resolve(result.Response.Organisations.Organisation);
          }
      });
  });
};

