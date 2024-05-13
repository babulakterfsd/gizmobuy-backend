import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderControllers } from './order.controller';
import { orderValidationSchema } from './order.validation';

const router = express.Router();

//create order
router.post(
  '/',
  auth('customer'),
  validateRequest(orderValidationSchema),
  OrderControllers.createOrder,
);

export const OrderRoutes = router;
