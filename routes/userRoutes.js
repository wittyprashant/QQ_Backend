import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import * as dotenv from 'dotenv';
import User from '../mongodb/models/user.js';
import Role from '../mongodb/models/role.js';
import jwt from 'jsonwebtoken';
import {createAxiosConfig, hashPassword, comparePassword  } from '../helpers/helpers.js';

dotenv.config();
const saltRounds = 10;

const router = express.Router();

const parseXeroDate = (dateString) => {
  const timestamp = parseInt(dateString.replace(/\/Date\((\d+)\)\//, '$1'), 10);
  return new Date(timestamp);
};

router.get('/', async (req, res) => {
  try {
      const users = await User.find({});
      res.status(200).json({status: 200, success: true,  data: users, message: 'Get all users successfully.' });
  } catch (err) {
      res.status(500).json({status: 500, success: false, message: 'Something went wrong!' });
  }
});

router.get('/getAllUsers', async (req, res) => {
  try {
      const config = createAxiosConfig(
          'get',
          'Users',
      );

      const response = await axios.request(config);
      const usersData = response.data;
      // console.log(usersData);
      
      if (!usersData || !Array.isArray(usersData.Users)) {
        throw new Error('Invalid data format: Users should be an array');
    }

    const existingUsers = await User.find({});
    const existingUserIDs = new Set(existingUsers.map(user => user.globalUserID));

    const newUsers = usersData.Users
        .filter(user => user.GlobalUserID && !existingUserIDs.has(user.GlobalUserID))
        .map(user => ({
            globalUserID: user.GlobalUserID,
            userID: user.UserID,
            emailAddress: user.EmailAddress,
            firstName: user.FirstName,
            lastName: user.LastName,
            updatedDateUTC: parseXeroDate(user.UpdatedDateUTC),
            isSubscriber: user.IsSubscriber,
            organisationRole: user.OrganisationRole
        }));

        if (newUsers.length > 0) {
            await User.insertMany(newUsers);
            res.status(200).json({status: 200, success: true,  data: usersData, message: 'Get all invoices successfully.' });
        } else {
            res.status(200).json({status: 200, success: true,  data: usersData, message: 'Get all invoices successfully.' });
        }
  } catch (err) {
      res.status(500).json({status: 500, success: 'false', message: err.message, code: err.code, data: []});
  }
});

const isValidPassword = (password) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
};

router.post('/register', async (req, res) => {
  try {
    const { 
        first_name, 
        last_name, 
        email, 
        role_id,
        password, 
        confirm_password, 
        status, 
        is_deleted 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      return res.status(400).json({status: 400, success: false, message: 'Invalid role ID format.' });
    }

    const role = await Role.findById(role_id);

    if (!role) {
      return res.status(404).json({status: 404, success: false, message: 'Role not found.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
        return res.status(400).json({
            status: "failed",
            data: [],
            message: "This email address is already being used.",
        });

    if (!first_name || !last_name || !email || !password || !confirm_password) {
      return res.status(400).json({status: 400, success: false, message: 'first name, last name, email, password, and confirm password are required' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({status: 400, success: false, message: 'Passwords do not match' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({status: 400, success: false, message: 'Your password needs to have at least 8 characters and contain letters and numbers.' });
    }

    const newUser = new User({
        first_name,
        last_name,
        email,
        role: role,
        password: await hashPassword(password),
        status,
        is_deleted,
    });

    await newUser.save();

    res.status(200).json({status: 200, success: true, data: newUser, message: 'User has been created successfully.' });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went wrong!' });
  }
});

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({status: 400, success: false, message: 'Email and password are required.' });
      }
  
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'This is not a valid email address.',
        });
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: 'This is not a valid email address.',
        });
      }
  
      const token = jwt.sign({ _id: user._id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

      res.status(200).json({
          status: 200,
          success: true,
          data: {
            ...user._doc,
            token: token,
            userId: user._id
          },
          message: 'User logged in successfully.',
        });
      } catch (err) {
        res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
      }
});

router.post('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({status: 404, success: false, message: 'User not found.' });
    }

    user.first_name = first_name;
    user.last_name = last_name;

    await user.save();

    res.status(200).json({status: 200, success: true, data: user, message: 'User profile has been updated successfully.' });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

router.post('/change_password/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({status: 400, success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({status: 404, success: false, message: 'User not found.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({status: 400, success: false, message: 'Your password needs to have at least 8 characters and contain letters and numbers.' });
    }

    user.password = await hashPassword(password);

    await user.save();

    res.status(200).json({status: 200, success: true, data: user, message: 'User password has been updated successfully.' });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({status: 400, success: false, message: 'Email are required.' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'This is not a valid email address.',
      });
    }

    res.status(200).json({
        status: 200,
        success: true,
        data: user,
        message: 'Password reset link send successfully.',
      });
    } catch (err) {
      res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
    }
});

router.post('/logout', async (req, res) => {
  try {
    res.status(200).json({
      status: 200,
      success: true,
      message: 'User logout successfully.',
    });
  } catch (err) {
    res.status(500).json({status: 500, success: false, message: 'Something went to wrong!' });
  }
});

export default router;