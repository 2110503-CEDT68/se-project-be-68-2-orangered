const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  appDate: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "MS_Users",
    required: true,
  },
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: "Shop",
    required: true,
  },
  massageType: { type: String, required: true },
  
  massagePrice: { type: Number, required: true }, 
  promotion: {
    title: String,
    discountPrice: Number, 
    originalPrice: Number  
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reservation", ReservationSchema);
