import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductControllers } from './product.controller';
import { productValidationSchema } from './product.validation';

const router = express.Router();

router.post(
  '/',
  auth('vendor'),
  validateRequest(productValidationSchema),
  ProductControllers.createProduct,
);

router.get('/', ProductControllers.getAllProducts);

export const ProductRoutes = router;
