const asyncHandler = require('express-async-handler')
const Users = require('../models/userModel')
const { Cart } = require("../models/cartModel");
const Products = require('../models/productModel')
const Orders = require('../models/orderModel')
const uniqid = require('uniqid')

// @desc Create new COD (Cash on Delivery) order
// @route POST /api/orders
// @access Private
createOrder = asyncHandler(async(req,res)=>{
    // Destructure required fields from request body
    const { address, email, contact, cartTotal } = req.body
    
    // Get user ID from authenticated request
    const userId = req.user._id
    
    // Verify user exists in database
    const user = await Users.findById(userId)
    
    // Get user's active cart
    const userCart = await Cart.findOne({userId: user._id})
    
    // Calculate final order amount
    const finalAmount = cartTotal

    // Create new order document
    const newOrder = await new Orders({
        products: userCart.products,
        paymentIntent: {
            id: uniqid(), // Generate unique transaction ID
            method: 'COD',
            amount: finalAmount,
            status: 'Cash on Delivery',
            created: Date.now(),
            currency: 'USD'
        },
        orderby: user._id,
        email: email,
        address: address,
        contact: contact,
        orderStatus: 'Cash on Delivery'
    }).save()

    // Note: Inventory management logic commented out for future implementation
    // let update = userCart.products.map((item)=>{
    //     return {
    //         updateOne: {
    //             filter: { _id: item.productId._id},
    //             update: {$inc: {quantity: -item.quantity, sold: +item.quantity}}
    //         }
    //     }
    // })
    // let updated = await Products.bulkWrite(update, {})

    res.json({message: 'Order created successfully'})
})

// @desc Get all orders (Admin)
// @route GET /api/orders
// @access Private/Admin
getOrders = asyncHandler(async(req,res)=>{
    // Fetch all orders from database
    const userOrders = await Orders.find()
    res.json(userOrders)
})

// @desc Get single order by ID
// @route GET /api/orders/:id
// @access Private
getOrder = asyncHandler(async(req,res)=>{
    // Find order by MongoDB _id
    const userOrder = await Orders.findById(req.params.id)
    res.json(userOrder)
})

// @desc Get logged-in user's orders
// @route GET /api/orders/user
// @access Private
getUserOrders = asyncHandler(async (req, res) => {
    // Get authenticated user's ID
    const userId= req.user._id
    
    // Find orders with populated product and user details
    const userOrders = await Orders.find({ orderby: userId })
        .populate("products.productId")  // Get full product details
        .populate("orderby")             // Get user details
        .exec()

    userOrders.length 
        ? res.json([userOrders])
        : res.json({msg: 'No Orders Found'})
})

// @desc Delete order by payment ID
// @route DELETE /api/orders/:id
// @access Private/Admin
deleteOrder = asyncHandler(async(req,res)=>{
    // Get payment ID from URL params
    const orderId = req.params.id
    
    // Verify order exists
    const userOrderAvailable = await Orders.findOne({"paymentIntent.id": orderId})
    
    // Delete order
    await Orders.findOneAndDelete({"paymentIntent.id": orderId})
    
    res.json({
        msg: 'Order successfully deleted',
        deletedOrder: userOrderAvailable
    })
})

// @desc Update order status
// @route PUT /api/orders/:id
// @access Private/Admin
updateOrderStatus = asyncHandler(async (req, res) => {
    // Get new status from request body
    const { status } = req.body
    
    // Update both orderStatus and paymentIntent.status
    const updateOrderStatus = await Orders.findByIdAndUpdate(
        req.params.id,
        {
          orderStatus: status,
          paymentIntent: {status: status}
        },
        { new: true } // Return updated document
      )
      
      res.json(updateOrderStatus);
})

module.exports = { 
    createOrder, 
    getOrders, 
    getOrder, 
    getUserOrders, 
    deleteOrder, 
    updateOrderStatus 
}
