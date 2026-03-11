// Consistent API Response Helper

export const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (res, message, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message);
};

export const sendCreated = (res, message, data = null) => {
  return sendResponse(res, 201, true, message, data);
};

export const sendNotFound = (res, message = 'Resource not found') => {
  return sendResponse(res, 404, false, message);
};

export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendResponse(res, 401, false, message);
};

export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendResponse(res, 403, false, message);
};

export const sendServerError = (res, message = 'Internal server error') => {
  return sendResponse(res, 500, false, message);
};
