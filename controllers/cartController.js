const { isValidObjectId } = require("mongoose");
const { Cart } = require("../models/cartModel");
const { Users } = require("../models/userModel");
const { Products } = require("../models/productModel");

// @desc Add item to cart
// @route POST /api/cart/add
// @access private
exports.addItemToCart = async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Validate user existence
    if (!userId) {
        res.status(400)
        throw new Error('No such user Found')
    }
    
    // Verify user exists in database
    const userAvailable = await Users?.findById(userId)
    
    // Destructure product details from request body
    let { productId, quantity, title, price, image } = req.body
    
    // Validate product ID presence
    if (!productId) {
        return res.status(400).send({ 
            status: false, 
            message: "Invalid product" 
        });
    }
    
    // Check product exists in database
    let productAvailable = await Products?.findOne({ _id: productId });

    // Get existing cart for user
    let cart = await Cart.findOne({ userId: userId });
    
    if (cart) {
        // Find if product already exists in cart
        let itemIndex = cart.products.findIndex(p => p.productId == productId);

        if (itemIndex > -1) {
            // Update quantity for existing product
            let productItem = cart.products[itemIndex];
            productItem.quantity += quantity;
            cart.products[itemIndex] = productItem;
        } else {
            // Add new product to cart
            cart.products.push({ 
                productId: productId, 
                quantity: quantity, 
                title: title, 
                image: image, 
                price: price 
            });
        }
        // Save updated cart
        cart = await cart.save();
        return res.status(200).send({ 
            status: true, 
            updatedCart: cart 
        });
    } else {
        // Create new cart if none exists
        const newCart = await Cart.create({
            userId,
            products: [{ 
                productId: productId, 
                quantity: quantity, 
                title: title, 
                image: image, 
                price: price 
            }],
        });
        return res.status(201).send({ 
            status: true, 
            newCart: newCart 
        });
    }
};

// @desc Get user's cart
// @route GET /api/cart/get
// @access private
exports.getCart = async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Validate user existence
    if (!userId) {
        res.status(400)
        throw new Error('No such user Found')
    }
    
    // Verify user exists in database
    const userAvailable = await Users?.findById(userId)

    // Find user's cart
    let cart = await Cart.findOne({ userId: userId });
    
    if (!cart) {
        return res.status(404).send({ 
            status: false, 
            message: "Cart not found for this user" 
        });
    }
    
    // Calculate cart items count
    const cartCount = cart.products.length

    res.status(200).send({ 
        status: true, 
        cart: cart, 
        cartCount: cartCount 
    });
};

// @desc Decrease product quantity in cart
// @route POST /api/cart/decrease
// @access private
exports.decreaseQuantity = async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Validate user existence
    if (!userId) {
        res.status(400)
        throw new Error('No such user Found')
    }

    // Get product details from request
    let productId = req.body.productId;
    let quantity = req.body.quantity

    // Find user's cart
    let cart = await Cart.findOne({ userId: userId });
    
    if (!cart) {
        return res.status(404).send({ 
            status: false, 
            message: "Cart not found for this user" 
        });
    }

    // Find product index in cart
    let itemIndex = cart.products.findIndex(p => p.productId == productId);

    if (itemIndex > -1) {
        // Update quantity and save
        let productItem = cart.products[itemIndex];
        productItem.quantity = Math.max(1, productItem.quantity - quantity); // Prevent negative quantities
        cart.products[itemIndex] = productItem;
        cart = await cart.save();
        return res.status(200).send({ 
            status: true, 
            updatedCart: cart 
        });
    }
    
    res.status(400).send({ 
        status: false, 
        message: "Item does not exist in cart" 
    });
};

// @desc Remove item from cart
// @route POST /api/cart/remove
// @access private
exports.removeItem = async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Validate user existence
    if (!userId) {
        res.status(400)
        throw new Error('No such user Found')
    }

    // Get product ID from request
    let productId = req.body.productId;

    // Find user's cart
    let cart = await Cart.findOne({ userId: userId });
    
    if (!cart) {
        return res.status(404).json({ 
            status: false, 
            message: "Cart not found for this user" 
        });
    }

    // Find product index and remove
    let itemIndex = cart.products.findIndex(p => p.productId == productId);
    
    if (itemIndex > -1) {
        cart.products.splice(itemIndex, 1);
        cart = await cart.save();
        return res.status(200).json({ 
            status: true, 
            updatedCart: cart 
        });
    }
    
    return res.status(400).json({ 
        status: false, 
        message: "Item does not exist in cart" 
    });
};

// @desc Empty user's cart
// @route DELETE /api/cart/delete
// @access private
exports.deleteCart = async (req, res) => {
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Validate user existence
    if (!userId) {
        res.status(400)
        throw new Error('No such user Found')
    }
    
    try {
        // Clear all products from cart
        await Cart.updateMany(
            { userId: userId }, 
            { $set: { products: [] } }
        );
        res.status(200).json({ 
            message: 'Cart cleared successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};
