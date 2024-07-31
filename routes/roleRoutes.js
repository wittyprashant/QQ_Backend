import express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import Role from '../mongodb/models/role.js';

dotenv.config();

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const roles = await Role.find({});
    res.status(200).json({status: 200, success: true, message: 'Get all roles successfully.',  data: roles });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

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
