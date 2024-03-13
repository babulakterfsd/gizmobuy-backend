import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './product.service';

//create product
const createProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.createProductInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product has been created succesfully',
    data: result,
  });
});

//get all products
const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB(req.query);

  res.status(200).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'All products fetched successfully',
    warning:
      'ডাটাগুলা অনেক সময় দিয়ে, কষ্ট করে বানাইছি ভাই চ্যাটজিপিটি দিয়ে।  প্লিজ চুরি করবেন না নিজের প্রজেক্ট এর জন্য, আমি ধরতে পারলে কিন্তু মামলা করে দিবো সত্যি সত্যি।  কমিউনিটি তে তো চোর হিসেবে মুখোশ খুলে দিবোই ',
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
};
