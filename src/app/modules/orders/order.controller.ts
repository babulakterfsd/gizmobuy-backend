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

//delete order for failed payment
const deleteOrderForFailedPayment = catchAsync(async (req, res) => {
  const result = await OrderServices.deleteOrderForFailedPayment(req);

  res.redirect(result.redirectUrl);
});

//delete order for cancelled payment
const deleteOrderForCancelledPayment = catchAsync(async (req, res) => {
  const result = await OrderServices.deleteOrderForCancelledPayment(req);

  res.redirect(result.redirectUrl);
});

// get all orders data
const getAllOrdersData = catchAsync(async (req, res) => {
  const result = await OrderServices.getAllOrdersDataFromDB(req, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders data fetched successfully',
    data: result,
  });
});

export const OrderControllers = {
  initPayment,
  createOrder,
  deleteOrderForFailedPayment,
  deleteOrderForCancelledPayment,
  getAllOrdersData,
};
