import axios from 'axios';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/AppError';
import { ProductModel } from '../products/product.model';
import { TOrder } from './order.interface';
import { OrderModel } from './order.model';

//initiate payment
const initiatePayment = async (order: TOrder) => {
  if (order?.products?.length < 1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No products found in order, please try again',
    );
  } else if (order?.products?.length > 0) {
    for (const product of order.products) {
      const productInDB = await ProductModel.findOne({ _id: product.id });
      if (!productInDB) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Product not found in database, please try again',
        );
      }
    }
  }

  // trnasaction to create order

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // transaction - 1
    await OrderModel.create([order], { session });

    await session.commitTransaction();
    await session.endSession();
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }

  const data = {
    store_id: config.store_id,
    store_passwd: config.store_passwd,
    total_amount: order?.totalBill,
    currency: 'USD',
    tran_id: `${Math.floor(Math.random() * 999)}${order?.orderBy.slice(
      0,
      10,
    )}${Date.now().toString().slice(7, 11)}`,
    success_url: `http://localhost:5000/api/orders/success?orderId=${order?.orderId}`,
    fail_url: `http://localhost:5000/api/orders/fail?orderId=${order?.orderId}`,
    cancel_url: `http://localhost:5000/api/orders/cancel?orderId=${order?.orderId}`,
    ipn_url: '',
    shipping_method: 'Courier',
    product_name: 'Gizmobuy',
    product_category: 'Gizmobuy',
    product_profile: 'Gizmobuy',
    cus_name: order.customerName,
    cus_email: order.orderBy,
    cus_add1: order?.shippingInfo?.address,
    cus_add2: order?.shippingInfo?.address,
    cus_city: order?.shippingInfo?.city,
    cus_state: order?.shippingInfo?.state,
    cus_postcode: order?.shippingInfo?.postalCode,
    cus_country: order?.shippingInfo?.country,
    cus_phone: order?.shippingInfo?.mobile,
    cus_fax: 'gizmobuy',
    ship_name: 'gizmobuy',
    ship_add1: order?.shippingInfo?.address,
    ship_add2: order?.shippingInfo?.address,
    ship_city: order?.shippingInfo?.city,
    ship_state: order?.shippingInfo?.state,
    ship_postcode: order?.shippingInfo?.postalCode,
    ship_country: order?.shippingInfo?.country,
  };

  const response = await axios({
    method: 'post',
    url: 'https://sandbox.sslcommerz.com/gwprocess/v3/api.php',
    data: data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.status !== 200) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to initiate payment, please try again',
    );
  } else {
    return response.data?.GatewayPageURL;
  }
};

//create order in DB
const createOrderInDB = async (req: any) => {
  const params = req.query;
  const orderId = params?.orderId;

  // update order status
  const order = await OrderModel.findOneAndUpdate(
    { orderId: orderId },
    {
      isPaid: true,
    },
    { new: true },
  );

  return { redirectUrl: 'http://localhost:5173/order-success' };
};

export const OrderServices = {
  initiatePayment,
  createOrderInDB,
};
