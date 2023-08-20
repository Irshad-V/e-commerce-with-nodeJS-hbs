const { dbUser, dbCart, dbOrder } = require("../db/userSchema");
const bcrypt = require("bcrypt")
const { ObjectId } = require("mongodb");
const { db } = require("../db/Productchema");

const Razorpay = require('razorpay');
var crypto = require('crypto');




var instance = new Razorpay({
    key_id: 'rzp_test_vs7bYwLImHAmcd',
    key_secret: 'HbEuCh7Z7Z7TT1SIH8MZFTZ3',
});



module.exports = {

    doSignup: async (req) => {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new dbUser({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        try {
            await newUser.save();

        } catch (error) {
            console.error('Error adding user:', error);
        }
        return newUser

    },
    doLogin: async (req) => {
        let data = {
        }
        const user = await dbUser.findOne({ email: req.body.email })

        if (user) {
            const result = await bcrypt.compare(req.body.password, user.password)

            if (result) {
                data.user = user;
                data.status = true


                return data
            } else {
                data.status = false

                return data
            }
        } else {
            console.log("user not exisit pls sign up");
            data.status = false
            return data
        }

    },

    // cart item

    addToCart: async (req, res, userIds) => {
        const Productid = new ObjectId(req.params.id)
        const userid = new ObjectId(userIds)
        let productData = {
            item: Productid,
            quantity: 1
        };

        let userCart = await dbCart.findOne({ user: userid }).lean().exec()

        if (userCart) {
            // let proExist = userCart.product.findIndex((product) => product.item.equals(Productid))

            let proExist = await dbCart.findOne({
                $and: [
                    { user: userid },
                    { "product.item": Productid }
                ]
            }).lean().exec()


            if (proExist) {
                try {
                    await dbCart.updateOne(
                        {
                            $and: [
                                { "product.item": Productid },
                                { user: userid }
                            ]
                        },
                        { $inc: { "product.$.quantity": 1 } }
                    );

                    console.log("Quantity updated successfully!"); ``

                } catch (error) {
                    console.error("Error updating quantity:", error);
                }

            } else {
                await dbCart.updateOne(
                    { user: userid },
                    { $addToSet: { product: productData } }
                );

            }

        }
        else {
            //product is an array it is defined in cart schema.look the prodcuSchema page 
            const newCartitem = new dbCart({
                user: userid,
                product: productData,
            });
            try {
                await newCartitem.save();
            } catch (error) {
                console.error('Error adding cart:', error);
            }


        }

    },


    getCartItems: async (userID) => {
        try {
            let cartItems = await dbCart.aggregate([
                {
                    $match: { user: new ObjectId(userID) }
                },

                {
                    $unwind: "$product"
                },
                {
                    $project: {
                        item: "$product.item",
                        quantity: "$product.quantity"
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "item",
                        foreignField: "_id",
                        as: "cart"
                    }

                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$cart", 0] }

                    }
                }

                // {


                //     $lookup:
                //     {
                //         from: "products",
                //         let: { prodList: "$product" },

                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {
                //                         $in: ["$_id", "$$prodList"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as: "cart"


                //     }
                // },
            ])
            console.log(cartItems);
            console.log("cartItems:");

            return cartItems


        } catch (error) {
            console.error("Error in getCartItems:", error);
            throw error;
        }

    },
    getCartCount: async (userID) => {
        let count = 0
        let cart = await dbCart.findOne({ user: new ObjectId(userID) })
        if (cart) {

            count = cart.product.length

        }

        return count
    },

    changeProductQuantity: async ({ cartId, proId, count, quantity }) => {


        if (count === -1 && quantity === 1) {
            await dbCart.updateOne({ _id: new ObjectId(cartId), },
                {
                    $pull: {
                        product: { item: new ObjectId(proId) }
                    }
                },
            )

            return { removedProduct: true }
        } else {

            await dbCart.updateOne({ _id: new ObjectId(cartId), "product.item": new ObjectId(proId) },
                {
                    $inc: {
                        "product.$.quantity": count
                    }
                }
            )

            return { removedProduct: false }

        }



    },


    cartProductRemove: async ({ cartId, proId }) => {
        await dbCart.updateOne({ _id: new ObjectId(cartId), },
            {
                $pull: {
                    product: { item: new ObjectId(proId) }
                }
            },
        )
        return { removedProduct: true }

    },
    TotalPriceCount: async (userId) => {

        let TotalPrice = await dbCart.aggregate([

            {
                $match: { user: new ObjectId(userId) }
            },



            {
                $unwind: "$product"
            },
            {
                $project: {
                    item: "$product.item",
                    quantity: "$product.quantity"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "item",
                    foreignField: "_id",
                    as: "cart"
                }

            },
            {
                $project: {
                    item: 1, quantity: 1, product: { $arrayElemAt: ["$cart", 0] }

                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $multiply: ["$quantity", "$product.price"] }
                    }
                }
            }

        ])




        if (TotalPrice.length > 0) {
            if (TotalPrice[0].hasOwnProperty('total')) {

                return TotalPrice[0].total
            }



        }








    },
    placeOrder: async (order, product, total) => {

        let status = order.method === "COD" ? "placed" : "pending"

        const ObjData = {

            deliveryDeatails: {
                mobile: order.phone,
                address: order.addres,
                pincode: order.pincode,
            },
            product: product,
            userId: new ObjectId(order.userId),
            PaymentMethod: order.method,
            total: total,
            Orderd_Date: new Date(),
            Payment_mode: order.method,
            status: status
        }
        const newProduct = new dbOrder(
            ObjData

        );
        try {
            await newProduct.save();

            await dbCart.findOneAndRemove({
                user: order.userId
            })

            console.log("order plced in mongodeb and deleted from cart")

            return newProduct._id


        } catch (error) {
            console.error('Error adding user:', error);
        }



    },


    getUserOrders: async (userID) => {
        const orders = await dbOrder.find({
            userId: new ObjectId(userID)
        })


        return orders



    },

    getCartProductList: async (userId) => {

        return dbCart.findOne({ user: new ObjectId(userId) })

    },

    // payment Gatway integration
    generateRazorPay: async (orderId, TotalPrice) => {

        const amount = TotalPrice * 100;
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: amount,
                currency: "INR",
                receipt: "" + orderId,

            }, (err, order) => {
                if (err) {
                    console.log(err);
                    resolve(err)

                } else {
                    console.log(order);
                    resolve(order)

                }

            })


        })

    },




    verifyPayment: (details) => {



        return new Promise((resolve, reject) => {
            let order_id = details.order.id;
            let razorpay_payment_id = details.payment.razorpay_payment_id
            const data = `${order_id}|${razorpay_payment_id}`;
            const razorpay_signature = details.payment.razorpay_signature
            const generated_signature = crypto.createHmac('sha256', 'HbEuCh7Z7Z7TT1SIH8MZFTZ3')
                .update(data)
                .digest('hex');
            if (generated_signature == razorpay_signature) {

                resolve()

            } else {
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        console.log("orederId");
        console.log(orderId);
        console.log("orderId");
        return new Promise((resolve, reject) => {
            dbOrder.updateOne({ _id: new ObjectId(orderId) }, { $set: { status: "placed" } })
                .then(() => {
                    resolve()
                })


        })

    },



}       