import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TProduct } from './product.interface';
import { ProductModel } from './product.model';

//create product in DB
const createProductInDB = async (product: TProduct) => {
  if (product?.stock < 1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stock should be equal or greater than 1',
    );
  } else if (product?.price < 1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Price should be equal or greater than 1',
    );
  }

  const result = await ProductModel.create(product);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create course');
  } else {
    return result;
  }
};

//get all products from DB
const getAllProductsFromDB = async (query: any) => {
  const {
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
    brand,
    vendor,
    category,
  } = query;

  const totalDocs = await ProductModel.countDocuments();

  const meta = {
    page: Number(page),
    limit: Number(limit),
    total: totalDocs,
  };

  //implement pagination
  const pageToBeFetched = Number(page);
  const limitToBeFetched = Number(limit);
  const skip = (pageToBeFetched - 1) * limitToBeFetched;

  //sort
  const sortCheck: Record<string, 1 | -1> = {};

  if (sortBy && ['price'].includes(sortBy)) {
    sortCheck[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  // filter
  const filter: Record<string, any> = {};

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (category !== 'all') {
    filter.category = new RegExp(category, 'i');
  } else if (category === 'all') {
    filter.category = new RegExp('', 'i');
  }

  if (brand) {
    filter.brand = new RegExp(brand, 'i');
  }

  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { brand: new RegExp(search, 'i') },
    ];
  }

  filter.stock = { $gte: 1 };

  // fetch products
  const result = await ProductModel.find(filter)
    .sort(sortCheck)
    .skip(skip)
    .limit(limitToBeFetched);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to get courses');
  } else {
    return {
      meta,
      data: result,
    };
  }
};

// get single product from DB
const getSingleProductFromDB = async (id: string) => {
  const result = await ProductModel.findById(id).populate('vendor');

  if (!result) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to get the product with this id',
    );
  } else {
    return result;
  }
};

export const ProductServices = {
  createProductInDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
};
