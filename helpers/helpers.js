import bcrypt from 'bcrypt';
import axios from 'axios';
import xml2js from 'xml2js';

const saltRounds = 10;

/**
 * Hashes a plain text password using bcrypt.
 *
 * @param {string} password - The plain text password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
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

/**
 * Compares a plain text password with a hashed password.
 *
 * @param {string} password - The plain text password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the passwords match, otherwise `false`.
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    const match = await bcrypt.compare(password.toString(), hashedPassword);
    return match;
  } catch (err) {
    throw new Error('Error comparing passwords');
  }
};


/**
 * Creates an Axios configuration object for making HTTP requests.
 *
 * @param {string} method - The HTTP method to be used (e.g., 'GET', 'POST').
 * @param {string} endPoint - The API endpoint to be appended to the base URL.
 * @param {number} [maxBodyLength=Infinity] - The maximum allowed size for the request body (optional, defaults to Infinity).
 * @returns {object} - The Axios configuration object.
 */
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

/**
 * Generates an OAuth2 token by sending a POST request to Xero's identity endpoint.
 *
 * @returns {Promise<object>} - A promise that resolves to the token data returned from the Xero API.
 */
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

/**
 * Parses XML data into an array of organizations.
 *
 * @param {string} xmlData - The XML data to be parsed.
 * @returns {Promise<Array>} - A promise that resolves to an array of organizations parsed from the XML.
 */
export const parseXmlToArray = async (xmlData) => {
  return new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, { explicitArray: true, mergeAttrs: true }, (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result.Response.Organisations.Organisation);
          }
      });
  });
};

