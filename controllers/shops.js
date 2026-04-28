const Shop = require("../models/Shop");
const Reservation = require("../models/Reservation");

exports.getShops = async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`,
  );
  const filters = JSON.parse(queryStr);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    if (req.query.sort === "promo") {
      const pipeline = [
        { $match: filters },
        {
          $facet: {
            promo: [
              {
                $match: {
                  massageType: {
                    $elemMatch: {
                      promotions: {
                        $elemMatch: {
                          isActive: true, 
                          endDate: { $gte: today } 
                        }
                      }
                    }
                  }
                }
              },
              { $addFields: { hasPromo: 1 } }
            ],
            nonPromo: [
              {
                $match: {
                  $or: [
                    { "massageType.promotions": { $size: 0 } }, 
                    {
                      massageType: {
                        $not: {
                          $elemMatch: {
                            promotions: {
                              $elemMatch: {
                                isActive: true,
                                endDate: { $gte: today }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              },
              { $addFields: { hasPromo: 0 } }
            ],
          },
        },

    {
      $project: {
        combined: { $concatArrays: ["$promo", "$nonPromo"] },
      },
    },

    { $unwind: "$combined" },
    { $replaceRoot: { newRoot: "$combined" } },

    { $sort: { hasPromo: -1, averageRating: -1, _id: -1 } },

    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: startIndex },
          { $limit: limit },
          {
            $lookup: {
              from: "reservations",
              localField: "_id",
              foreignField: "shop",
              as: "reservations",
            },
          },
        ],
      },
    },
  ];

  const result = await Shop.aggregate(pipeline);
  total = result[0].metadata[0]?.total || 0;
  shops = result[0].data;
} else {
      total = await Shop.countDocuments(filters);
      query = Shop.find(filters).populate("reservations");

      // Select fields
      if (req.query.select) {
        const fields = req.query.select.split(",").join(" ");
        query = query.select(fields);
      }

      // Sort
      if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-_id");
      }

      shops = await query.skip(startIndex).limit(limit);
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages,
    };

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: shops.length,
      pagination,
      data: shops,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getShop = async (req, res, next) => {
  try {
    const shops = await Shop.findById(req.params.id);

    if (!shops) {
      return res.status(404).json({
        success: false,
        error: "This shop doesnt exist",
      });
    }

    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

exports.createShop = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isShopOwner = req.user.role === "shopowner";

    if (!isAdmin && !isShopOwner) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to create a shop",
      });
    }

    console.log("Before Save:", req.body.picture);
    const shop = await Shop.create({
      ...req.body,
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: shop,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: "This shop doesnt exist",
      });
    }

    if (req.user.role !== "admin" && shop.owner?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this shop",
      });
    }

    const shops = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

exports.deleteShop = async (req, res, next) => {
  try {
    const shops = await Shop.findById(req.params.id);

    if (!shops) {
      return res.status(404).json({ success: false });
    }

    if (req.user.role !== "admin" && shops.owner?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this shop",
      });
    }

    await Reservation.deleteMany({ shop: req.params.id });
    await Shop.deleteOne({ _id: req.params.id });
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
