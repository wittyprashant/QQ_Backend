import express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Role from '../mongodb/models/role.js';

dotenv.config();

const router = express.Router();

/**
 * Fetches all roles from the database.
 *
 * @returns {Object} 200 - An object containing the status, success flag, message, and the array of roles
 * @returns {Object} 500 - An object containing the status, success flag, and error message
 */
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find({});
    res.status(200).json({status: 200, success: true, message: 'Get all roles successfully.',  data: roles });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

/**
 * Creates a new role in the database.
 *
 * @param {string} name.body.required - The name of the role
 * @param {Array} permission.body.required - The permissions associated with the role
 * @param {Array} action_permission.body.required - The actions that the role is permitted to perform
 * @param {boolean} [is_listing.body] - Indicates if the role is listed (optional)
 * @param {boolean} [status.body] - Indicates if the role is active (optional)
 * @param {boolean} [is_deleted.body] - Indicates if the role is deleted (optional)
 * @returns {Object} 200 - An object containing the status, success flag, message, and the newly created role
 * @returns {Object} 400 - An object containing the status, success flag, and error message if required fields are missing
 * @returns {Object} 500 - An object containing the status, success flag, and error message for server errors
 */
router.post('/', async (req, res) => {
  try {
    const { name, permission, action_permission, is_listing, status, is_deleted } = req.body;
    if (!name || !permission || !action_permission) {
      return res.status(400).json({status: 400, success: false, message: 'Name, permission, and action permission are required' });
    }

    const newRole = new Role({
      name,
      permission,
      action_permission,
      is_listing,
      status,
      is_deleted,
    });

    await newRole.save();

    res.status(200).json({status: 200, success: true, data: newRole, message: 'Role has been created successfully.' });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

/**
 * Updates an existing role in the database by ID.
 * 
 * @route POST /update/{id}
 * @param {string} id.path.required - The ID of the role to be updated
 * @param {string} [name.body] - The updated name of the role (optional)
 * @param {Array} [permission.body] - The updated permissions associated with the role (optional)
 * @param {Array} [action_permission.body] - The updated actions that the role is permitted to perform (optional)
 * @param {boolean} [is_listing.body] - Indicates if the role is listed (optional)
 * @param {boolean} [status.body] - Indicates if the role is active (optional)
 * @returns {Object} 200 - An object containing the status, success flag, message, and the updated role
 * @returns {Object} 400 - An object containing the status, success flag, and error message if the ID format is invalid or required fields are missing
 * @returns {Object} 404 - An object containing the status, success flag, and error message if the role is not found
 * @returns {Object} 500 - An object containing the status, success flag, and error message for server errors
 */
router.post('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permission, action_permission, is_listing, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({status: 400, success: false, message: 'Invalid user ID format.' });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({status: 404, success: false, message: 'Role not found.' });
    }

    role.name = name;
    role.permission = permission;
    role.action_permission = action_permission;
    role.is_listing = is_listing;
    role.status = status;

    await role.save();

    res.status(200).json({status: 200, success: true, data: role, message: 'Role has been updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

export default router;
