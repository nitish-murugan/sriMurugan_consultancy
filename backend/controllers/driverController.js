import Driver from '../models/Driver.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';

export const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    sendSuccess(res, 'Drivers fetched successfully', { drivers });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export const addDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber } = req.body;
    
    // Check if duplicate
    const existingDriver = await Driver.findOne({ $or: [{ phone }, { licenseNumber }] });
    if (existingDriver) {
      return sendError(res, 'Driver with this phone or license number already exists', 400);
    }

    const driver = await Driver.create({ name, phone, licenseNumber });
    sendCreated(res, 'Driver added successfully', driver);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return sendNotFound(res, 'Driver not found');
    }
    
    await driver.deleteOne();
    sendSuccess(res, 'Driver deleted successfully');
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
