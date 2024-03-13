import { Router } from 'express';
import { AuthRoutes } from '../modules/authentication/auth.route';
import { ProductRoutes } from '../modules/products/product.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
