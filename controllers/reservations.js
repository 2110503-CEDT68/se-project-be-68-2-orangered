const Reservation = require('../models/Reservation');
const Shop = require('../models/Shop');

exports.getReservations = async (req, res, next) => {
    let query;
    let filters = {};

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Shopowner can see reservations for their shops
    if(req.user.role === 'shopowner'){
        // Find all shops owned by this shopowner
        const shopIds = await Shop.find({ owner: req.user.id }).select('_id');
        const shopIdArray = shopIds.map(s => s._id);
        
        filters = { shop: { $in: shopIdArray } };
        query = Reservation.find(filters).populate({
            path: 'shop',
            select: 'name province tel owner'
        }).populate({
            path: 'user',
            select: 'name tel email'
        });
    // General user can see only their reservation
    }else if(req.user.role !== 'admin'){
        filters = { user: req.user.id };
        query = Reservation.find(filters).populate({
            path: 'shop',
            select: 'name province tel'
        });
    // Can see everyone on admin
    }else{ 
        if(req.params.shopId) {
            filters = { shop: req.params.shopId };
            query = Reservation.find(filters).populate({
                path: 'user',
                select: 'name tel email'
            });
        }else{
            query = Reservation.find(filters).populate({
                path: 'shop',
                select: 'name province tel'
            }).populate({
                path: 'user',
                select: 'name tel email'
            });
        }
    }

    try{
        const total = await Reservation.countDocuments(filters);
        const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

        query = query.sort('appDate').skip(startIndex).limit(limit);

        const reservation = await query;

        const pagination = {
            page,
            limit,
            total,
            totalPages
        };

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: reservation.length,
            pagination,
            data: reservation
        })
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot find Reservation"
        });
    }
};

exports.getReservation = async (req, res, next) => {
    try{
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'shop',
            select: 'name description tel'
        }).populate({
            path: 'user',
            select: 'name email role massageType'
        });

        if(!reservation){
            return res.status(400).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        })
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot find Reservation"
        });
    }
};

exports.addReservation = async (req, res, next) => {
    try{
        req.body.shop = req.params.shopId;

        const shop = await Shop.findById(req.params.shopId)

        if(!shop){
            return res.status(400).json({
                success: false,
                message: `No shop with the id of ${req.params.shopId}`
            });
        }

        // add user Id to req.body
        req.body.user = req.user.id;

        // Check for existed reservation
        const existedReservations = await Reservation.find({user: req.user.id});

        // If user isnt admin, they can only create 3 reservation
        if(existedReservations.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 reservations`
            });
        }


        const reservation = await Reservation.create(req.body);

        res.status(201).json({
            success: true,
            data: reservation
        });
    }catch(err){
        console.log(err);
        
        return res.status(500).json({
            success: false,
            message: "Cannot create Reservation"
        });
    }
}

exports.updateReservation = async (req, res, next) => {
    try{
        let reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            return res.status(400).json({
                success: false,
                message: `No reservation with the id of ${req.params.shopId}`
            });
        }

        // Make sure user is the reservation owner
        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                message: `The ${req.user.id} is not authorized to update this reservation`
            });
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: reservation
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot update Reservation"
        });
    }
}

exports.deleteReservation = async (req, res, next) => {
    try{
        let reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            return res.status(400).json({
                success: false,
                message: `No reservation with the id of ${req.params.shopId}`
            });
        }

        // Make sure user is the reservation owner
        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                message: `The ${req.user.id} is not authorized to delete this reservation`
            });
        }

        await reservation.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Cannot delete Reservation"
        });
    }
}
