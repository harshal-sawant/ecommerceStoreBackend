const asyncHandler = require('express-async-handler')
const Users = require('../models/userModel')
const CryptoJS = require('crypto-js')
const jwt = require('jsonwebtoken')
const { Cart } = require("../models/cartModel");

// @desc To Register a User
// @route POST /api/auth/register
// @access public
userRegister = asyncHandler(async(req,res)=>{
    // Destructure the request body to get username, email, password, and isAdmin
    const { username, email, password, isAdmin } = req.body
    // Check if all fields are provided
    if (!username | !email | !password){
        res.status(400)
        throw new Error('All fields are mandatory')
    }

    // Check if the username is already taken
    const usernameAvailable = await Users.findOne({username})
    if (usernameAvailable){
        throw new Error('UserName Taken')
    }
    // Check if the email is already taken
    const emailAvailable = await Users.findOne({email})
    if (emailAvailable){
        throw new Error('Email Taken')
    }
    else{
        // Hash the password using CryptoJS
        const hashedPassword = CryptoJS.AES.encrypt(password, process.env.PASSWORD_KEY).toString()
        // Create a new user with the provided details
        const user = await Users.create({
        username, email, password:hashedPassword, isAdmin
    })
    if (user){
        // Exclude the password from the response
        const { password, ...others} = user._doc
        res.status(201).json(others)
    }
    else{
        res.status(400)
        throw new Error('Data not valid')
    }
    }
    
})

// @desc To Login using existing Users
// @route POST /api/auth/login
// @access public
loginUser = asyncHandler(async(req,res)=>{
    // Destructure the request body to get email and password
    const { email, password } = req.body
    // Check if all fields are provided
    if (!email | !password){
        res.status(400)
        throw new Error('All fields are mandatory')
    }
    // Find the user by email
    const user = await Users.findOne({email})
    
    // Check if the user exists
    if (!user){
        res.status(400)
        throw new Error('No such User')
    }
    // Decrypt the stored password
    const decryptedPassword = CryptoJS.AES.decrypt(user.password, process.env.PASSWORD_KEY).toString(CryptoJS.enc.Utf8)
    // Check if the decrypted password matches the provided password
    if (decryptedPassword!=password){
        res.status(400)
        throw new Error('Invalid Password')
    }
    // Generate an access token using JWT
    const accessToken = jwt.sign({
        _id: user._id,
        isAdmin: user.isAdmin,
    }, process.env.JWT_KEY,{expiresIn: '1d'})

    // Find the user's cart
    let cart = await Cart.findOne({ userId: user._id });
    // If the cart doesn't exist, create a new one
    if(!cart){
        await Cart.create({
            userId: user._id,
            products: [],
        })
    }

    // Respond with the user details and access token
    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email, 
        accessToken,
        isAdmin: user.isAdmin
    })
})



module.exports = { userRegister, loginUser }
