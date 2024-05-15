import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';

// init payment
const initPayment = catchAsync(async (req, res) => {
  const response = await OrderServices.initiatePayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment initiated successfully',
    data: response,
  });
});

//create order
const createOrder = catchAsync(async (req, res) => {
  const result = await OrderServices.createOrderInDB(req);

  res.redirect(result.redirectUrl);
});

export const OrderControllers = {
  initPayment,
  createOrder,
};
