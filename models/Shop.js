const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxLength: [50, "Name can not be more than 50 characters"],
    },
    address: {
      street: {
        type: String,
        required: [true, "Please add an address"],
      },
      district: {
        type: String,
        required: [true, "Please add a district"],
      },
      province: {
        type: String,
        required: [true, "Please add a province"],
      },
      postalcode: {
        type: String,
        required: [true, "Please add a postal code"],
        maxlength: [5, "Postal Code cannot be more than 5 digits"],
      },
    },
    tel: {
      type: String,
      required: [true, "Please add an telephone number"],
      match: [/^[0-9]{10}$/, "Telephone number must be exactly 10 digits"],
    },
    openClose: {
      open: {
        type: String,
        required: [true, "Please add a Opening time"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Please use valid time format HH:mm from 00:00 - 23:59",
        ],
      },
      close: {
        type: String,
        required: [true, "Please add a Closing time"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Please use valid time format HH:mm from 00:00 - 23:59",
        ],
      },
    },
    picture: {
      type: String,
      // required: [true, "Please add a picture url"],
    },
    shopDescription: {
      type: String,
      // required: [true, "Please add a shop description"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    massageType: [
      {
        name: {
          type: String,
          required: [true, "Please add a massage name"],
        },
        description: {
          type: String,
          // required: [true, "Please add a description for the massage"],
        },
        price: {
          type: Number,
          required: [true, "Please add a price"],
        },
        picture: {
          type: String,
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Reverse poppulation with virtuals
ShopSchema.virtual("reservations", {
  ref: "Reservation",
  localField: "_id",
  foreignField: "Shop",
  justOne: false,
});

module.exports = mongoose.model("Shop", ShopSchema);
