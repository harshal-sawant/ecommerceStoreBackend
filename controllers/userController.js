const asyncHandler = require('express-async-handler')
const Users = require('../models/userModel')
const Carts = require('../models/cartModel')
const Products = require('../models/productModel')
const CryptoJS = require('crypto-js')

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private/Admin
getUsers = asyncHandler(async(req,res)=>{
    // Fetch all user documents
    const users = await Users.find()
    if (!users){
        res.status(400)
        throw new Error('No Users Found')
    }
    res.status(200).json(users)
})

// @desc Get current user profile
// @route GET /api/users/:id
// @access Private
getUser = asyncHandler(async(req,res)=>{
    // Find user by ID with sensitive fields filtered out
    const user = await Users.findById(req.params.id)
    if (!user){
        res.status(400)
        throw new Error('User not found')
    }
    res.status(200).json({
        _id: user.id,
        username: user.username,
        email: user.email
    })
})

// @desc Update user profile
// @route PUT /api/users/:id
// @access Private
updateUser = asyncHandler(async(req,res)=>{
    // Verify user exists
    const userAvailable = await Users.findById(req.params.id)
    if (!userAvailable){
        res.status(400)
        throw new Error('User not found')
    }
    
    // Destructure and process update data
    const { username, email, password } = req.body 
    
    // Encrypt new password if provided
    const hashedPassword = CryptoJS.AES.encrypt(
        password, 
        process.env.PASSWORD_KEY
    ).toString()

    // Perform update with new values
    const userUpdated = await Users.findByIdAndUpdate(
        req.params.id, 
        {
            username,
            email,
            password: hashedPassword
        }, 
        {new: true} // Return updated document
    )
    
    res.status(200).json({
        _id: userUpdated.id,
        username: userUpdated.username,
        email: userUpdated.email
    })
})

// @desc Delete user account
// @route DELETE /api/users/:id
// @access Private
deleteUser = asyncHandler(async(req,res)=>{
    // Verify user exists
    const user = await Users.findById(req.params.id)
    if (!user){
        res.status(400)
        throw new Error('User not found')
    }
    
    // Delete user document
    await Users.findByIdAndDelete(req.params.id)
    
    // Return confirmation with basic user info
    res.status(200).json({
        _id: user.id,
        username: user.username,
        email: user.email
    })
})

// @desc Get user's wishlist with product details
// @route GET /api/users/wishlist
// @access Private
getWishlist = asyncHandler(async(req,res)=>{
    // Get authenticated user ID
    userId = req.user._id
    if (!userId){
        res.status(400)
        throw new Error('Authentication required')
    }
    
    // Get wishlist with populated product data
    const userWishlist = await Users.findById(userId)
        .populate("wishlist") // Expand product references
        .select('username wishlist') // Only return these fields
        
    res.status(200).json(userWishlist)
})

// @desc Save/update user address
// @route POST /api/users/address
// @access Private
saveUserAddress = asyncHandler(async(req,res)=>{
    // Get authenticated user ID
    userId = req.user._id
    if (!userId){
        res.status(400)
        throw new Error('Authentication required')
    }
    
    // Extract address from request body
    const { address } = req.body
    
    // Update address field only
    const userAddress = await Users.findByIdAndUpdate(
        userId, 
        {address: address}, 
        {new: true}
    ).select('username address') // Return only necessary fields
    
    res.json(userAddress)
})

module.exports = { 
    getUsers, 
    getUser, 
    updateUser, 
    deleteUser, 
    getWishlist, 
    saveUserAddress 
}
