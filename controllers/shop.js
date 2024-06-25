const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const Product = require('../models/product');
const Order = require('../models/order');

module.exports.getIndex = (req, res, next) => {
    Product
        .find()
        .then(products => {
            res.render('shop/index', {
                pageTitle: 'Shop',
                path: '/',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getProducts = (req, res, next) => {
    Product
        .find()
        // .select('title price -_id')
        // .populate('userId', '_id')
        .then(products => {
            res.render('shop/product-list', {
                pageTitle: 'Products',
                path: '/products',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;

    Product
        .findById(productId)
        .then(product => {
            res.render('shop/product-details', {
                pageTitle: product.title,
                path: '/products',
                product: product,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            let products = [...user.cart.items].map(product => {
                return { ...product.productId._doc, quantity: product.quantity };
            });
            res.render('shop/cart', {
                pageTitle: 'Cart',
                path: '/cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    req.user.addToCart(productId)
        .then(result => {
            res.redirect('/');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.postDeleteCartProduct = (req, res, next) => {
    const productId = req.body.productId;
    req.user.deleteItemFromCart(productId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getOrders = (req, res, next) => {
    Order
        .find({
            'user._id': req.user._id
        })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Orders',
                path: '/orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    _id: item.productId._id,
                    title: item.productId.title,
                    price: item.productId.price,
                    description: item.productId.description,
                    imageUrl: item.productId.imageUrl,
                    quantity: item.quantity
                };
            });
            const order = new Order({
                user: {
                    _id: user._id,
                    email: user.email,
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


module.exports.getInvoice = (req, res, next) => {

    const orderId = req.params.orderId;


    Order.findById(orderId)
        .then(order => {

            if (!order) {
                return next(new Error('No order found!'))
            }
            if (order.user._id.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized access!'))
            }

            const invoiceName = 'invoice-' + orderId + '.pdf'
            const invoicePath = path.join('data', 'invoices', invoiceName)

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'filename="' + invoiceName + '"');
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) {
            //         console.log('file error')
            //         return next(err)
            //     }
            //     res.setHeader('Content-Type', 'application/pdf')
            //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            //     res.send(data)
            // })


            //This is done so that large file takes time to render
            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf')
            // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            // file.pipe(res);

            const pdfDoc = new PDFDocument();
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice # ' + order._id);
            pdfDoc.text('--------------------------------------------------');
            pdfDoc.fontSize(16);

            let index = 1;
            let totalPrice = 0;

            order.products.forEach(product => {
                let calculatedPrice = product.price * product.quantity;
                pdfDoc.text(index + '. ' + product.title + " ( " + product.quantity + " ) " + ' - ' + calculatedPrice);
                totalPrice += calculatedPrice;
                index++;
            });

            pdfDoc.text('----------------------------------------------------------------------------------');

            pdfDoc.fontSize(24).text('Total: ' + totalPrice.toFixed(2));
            pdfDoc.end();

        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
        })
}