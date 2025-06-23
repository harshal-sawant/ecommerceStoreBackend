const asyncHandler = require('express-async-handler')
const Products = require('../models/productModel') 
const Users = require('../models/userModel') 
const slugify = require('slugify')

// @desc Get products with optional filters
// @route GET /api/products
// @access Public
getProducts = asyncHandler(async(req,res)=>{ 
    // Handle query parameters for filtering
    const qNew = req.query.new // Get 'new' query parameter
    const qCategory = req.query.category // Get category filter
    let products

    if(qNew){
        // Get 2 newest products sorted by creation date
        products = await Products.find().sort({createdAt:-1}).limit(2)
    }else if(qCategory){
        // Get products in specified category
        products = await Products.find({
            categories: {
                $in: [qCategory]
            }
        })
    }else{
        // Get all products if no filters
        products = await Products.find()
    }
    
    res.status(200).json(products)
})

// @desc Get single product by ID
// @route GET /api/products/:id
// @access Public
getProduct = asyncHandler(async(req,res)=>{
   

    const productAvailable = await Products.findById(req.params.id)
    if (!productAvailable){
        res.status(400)
        throw new Error('Product not found')
    }
    res.status(200).json(productAvailable)
})

// @desc Get products listed by current seller
// @route GET /api/products/seller
// @access Private/Seller
getSellerProducts = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    if (!userId){
        res.status(400)
        throw new Error('User not authenticated')
    }
    // Find products where current user is the lister
    const products = await Products.find({ listedBy: userId })
    res.status(200).json(products)
})

// @desc Create new product
// @route POST /api/products
// @access Private/Admin
createProduct = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    if (!userId){
        res.status(400)
        throw new Error('Authentication required')
    }
    const { title, price } = req.body
    
    // Validate required fields
    if (!title || !price){
        throw new Error('Title and price are required')
    }
    
    // Generate SEO-friendly slug
    if (title) req.body.slug = slugify(title)
    
    // Merge user ID with product data
    const mergedData = {
        ...req.body,
        listedBy: userId // Set product lister
    }
    
    const product = await Products.create(mergedData)
    res.status(201).json(product)
})

// @desc Update existing product
// @route PUT /api/products/:id
// @access Private/Admin
updateProduct = asyncHandler(async(req,res)=>{
    // Regenerate slug if title changes
    if (req.body.title) req.body.slug = slugify(req.body.title)
    
    const productAvailable = await Products.findById(req.params.id)
    if (!productAvailable){
        res.status(400)
        throw new Error('Product not found')
    }
    
    // Update and return modified document
    const productUpdated = await Products.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        {new: true}
    )
    res.status(200).json(productUpdated)
})

// @desc Delete product
// @route DELETE /api/products/:id
// @access Private/Admin
deleteProduct = asyncHandler(async(req,res)=>{
    const productAvailable = await Products.findById(req.params.id)
    if (!productAvailable){
        res.status(400)
        throw new Error('Product not found')
    }
    await Products.findByIdAndDelete(req.params.id)
    res.status(200).json(productAvailable)
})

// @desc Toggle product in user's wishlist
// @route POST /api/products/wishlist
// @access Private
addToWishlist = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const {productId} = req.body
    
    const user = await Users.findById(userId)
    if (!user) throw new Error('User not found')
    
    // Check if product exists in wishlist
    const productAlreadyAdded = user.wishlist.find((id) => id.toString() === productId)
    
    if (productAlreadyAdded){
        // Remove from wishlist
        let user = await Users.findByIdAndUpdate(userId, {
            $pull: {wishlist: productId},  
        },{new: true})
        res.json(user)
    }else{
        // Add to wishlist
        let user = await Users.findByIdAndUpdate(userId, {
            $push: {wishlist: productId},  
        },{new: true})
        res.json(user)
    }
})

// @desc Add/update product rating
// @route POST /api/products/rating
// @access Private
rating = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const {star, productId, comments} = req.body
    
    // Validate user and product existence
    const user = await Users.findById(userId)
    if (!user) throw new Error('User not found')
    const product = await Products.findById(productId)
    if (!product) throw new Error('Product not found')
    
    // Check for existing rating
    let productAlreadyRated = product.ratings.find(
        (rating)=>rating.postedby.toString()===userId
    )
    
    if (productAlreadyRated){
        // Update existing rating
        await Products.updateOne(
            {ratings: {$elemMatch: productAlreadyRated}},
            {$set: {
                "ratings.$.star": star, 
                "ratings.$.comments": comments
            }},
            {new: true}
        )
    }else{
        // Add new rating
        await Products.findByIdAndUpdate(productId, {
            $push: { 
                ratings: {
                    star: star, 
                    comments: comments, 
                    postedby: userId
                } 
            }
        },{new: true})
    }

    // Calculate new average rating
    const getAllRatings = await Products.findById(productId) 
    const totalRatings = getAllRatings.ratings.length
    const ratingSum = getAllRatings.ratings
        .map((item)=>item.star)
        .reduce((a,b)=> a + b, 0)
    const actualRating = Math.round(ratingSum/totalRatings)
    
    // Update product with new average rating
    const productRating = await Products.findByIdAndUpdate(productId, 
        {totalRatings: actualRating}, 
        {new: true}
    )
    res.json(productRating)
})

module.exports = { 
    getProducts, 
    getProduct, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    addToWishlist, 
    rating 
}
