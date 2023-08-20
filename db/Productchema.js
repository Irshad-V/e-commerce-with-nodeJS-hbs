const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
  Productname: String,
  category: String,
  price: Number,
  description: String,
  image: String
 
});

const dbProduct = mongoose.model('Product', ProductSchema);




module.exports = dbProduct