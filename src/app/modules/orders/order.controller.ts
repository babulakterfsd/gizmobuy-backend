import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';

//create order
const createOrder = catchAsync(async (req, res) => {
  const result = await OrderServices.createOrderInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order placed successfully',
    data: result,
  });
});

export const OrderControllers = {
  createOrder,
};
