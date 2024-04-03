import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductControllers } from './product.controller';
import { productValidationSchema } from './product.validation';

const router = express.Router();

//create product
router.post(
  '/',
  auth('vendor'),
  validateRequest(productValidationSchema),
  ProductControllers.createProduct,
);

// get single product
router.get('/:id', ProductControllers.getSingleProduct);

// get all products
router.get('/', ProductControllers.getAllProducts);

export const ProductRoutes = router;
