const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth')
const productValidator = require("../validators/product")

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', isAuth, adminController.postAddProduct);

// /admin/edit-product => GET
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit-product => POST
router.post('/edit-product', isAuth, productValidator.productInfo, adminController.postEditProduct);

// /admin/delete-product => POST
router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
