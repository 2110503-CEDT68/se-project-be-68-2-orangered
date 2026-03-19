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
    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operator ${gt, lt, in}
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Find resource
    query = Shop.find(JSON.parse(queryStr)).populate('reservations');

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    

    try{
        const total = await Shop.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const shops = await query;
        console.log(req.query);

        // Pagination result
        const pagination = {};

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
    const shop = await Shop.create(req.body);
    res.status(201).json({
        success:true,
        data:shop
    });
};

exports.updateShop = async (req, res, next) => {
    try{
        const shops = await Shop.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if(!shops){
            return res.status(404).json({
                success:false,
                error: 'This shop doesnt exist'
            });
        }

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
            res.status(400).json({success:false});
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