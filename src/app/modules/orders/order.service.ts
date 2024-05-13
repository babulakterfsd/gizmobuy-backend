import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { ProductModel } from '../products/product.model';
import { TOrder } from './order.interface';
import { OrderModel } from './order.model';

//create order in DB
const createOrderInDB = async (order: TOrder) => {
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

  //trnasaction to create order
  let result;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // transaction - 1
    result = await OrderModel.create([order], { session });

    // transaction - 2 (check if payment is successful)

    await session.commitTransaction();
    await session.endSession();

    if (result.length < 1) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to place order, please try again',
      );
    }

    return result[0];
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

export const OrderServices = {
  createOrderInDB,
};
