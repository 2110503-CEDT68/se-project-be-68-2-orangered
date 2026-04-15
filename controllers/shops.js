const Shop = require("../models/Shop");
const Reservation = require('../models/Reservation');

exports.getShops = async (req, res, next) => {
    let query;

    // copy req.query
    const reqQuery = {...req.query};

    // Field to be excluded
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over remove fields and delete from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operator ${gt, lt, in}
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    const filters = JSON.parse(queryStr);

    // Find resource
    query = Shop.find(filters).populate('reservations');

    // Select fields
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 25, 1);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    

    try{
        const total = await Shop.countDocuments(filters);
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const shops = await query;

        // Pagination result
        const pagination = {
            page,
            limit,
            total,
            totalPages
        };

        if (endIndex < total) {
            pagination.next = {
                page: page+1,
                limit
            }
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }

        res.status(200).json({
            success:true, 
            count: shops.length, 
            pagination,
            data: shops
        });
    }catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

exports.getShop = async (req, res, next) => {
    try{
        const shops = await Shop.findById(req.params.id);

        if(!shops){
            return res.status(404).json({
                success:false,
                error: 'This shop doesnt exist'
            });
        }

        return res.status(200).json({
            success:true, 
            data:shops
        });
    }catch(err){
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

exports.createShop = async (req, res, next) => {

    try {
        const isAdmin = req.user.role === 'admin';
        const isShopOwner = req.user.role === 'shopowner';

        if (!isAdmin && !isShopOwner) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to create a shop'
            });
        }

        console.log("Before Save:", req.body.picture);
        const shop = await Shop.create({
            ...req.body,
            owner: req.user.id,
        });

        res.status(201).json({
            success:true,
            data:shop
        });
    } catch (err) {
        res.status(400).json({success:false, error: err.message});
    }
};

exports.updateShop = async (req, res, next) => {


    try{
        const shop = await Shop.findById(req.params.id);

        if(!shop){
            return res.status(404).json({
                success:false,
                error: 'This shop doesnt exist'
            });
        }

        if (req.user.role !== 'admin' && shop.owner?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to edit this shop'
            });
        }

        const shops = await Shop.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success:true, 
            data:shops
        });
    }catch(err){
        res.status(400).json({success:false});
    }
};

exports.deleteShop = async (req, res, next) => {
    try{
        const shops = await Shop.findById(req.params.id,);

        if(!shops){
            return res.status(404).json({success:false});
        }

        if (req.user.role !== 'admin' && shops.owner?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this shop'
            });
        }

        await Reservation.deleteMany({shop: req.params.id});
        await Shop.deleteOne({ _id: req.params.id});
        res.status(200).json({
            success:true, 
            data:{}
        });
    }catch(err){
        res.status(400).json({success:false});
    }
};
