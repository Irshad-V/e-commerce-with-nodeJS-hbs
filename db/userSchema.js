const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

});

const dbUser = mongoose.model('user', userSchema);

//  cart

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        require: true
    },
    product: [{

        item: mongoose.Types.ObjectId,
        quantity: Number,

    }],




});
const dbCart = mongoose.model('cart', cartSchema);
//  ////////////////////////////////
// orderPlace



const orderSchema = new mongoose.Schema({


    deliveryDeatails: {
        mobile: { type: Number },
        address: { type: String },
        pincode: { type: Number },

    },
    userId: { type: mongoose.Types.ObjectId },
    paymentMethod: { type: String },
    total: { type: Number },
    product: [],
    Orderd_Date: { type: Date, required: true },
    Payment_mode:{type:String},
    status: String


});
const dbOrder = mongoose.model('order', orderSchema);

module.exports = { dbUser, dbCart, dbOrder }