


const dbProduct = require("../db/Productchema")
const fs = require("fs");
const path = require("path")


module.exports = {
    addProducts: async (req) => {
        const newProduct = new dbProduct({
            Productname: req.body.name,
            category: req.body.category,
            price: req.body.price,
            description: req.body.description,
            image: req.file.filename
        });
        try {
            const savedProduct = await newProduct.save();

        } catch (error) {
            console.error('Error adding user:', error);
        }

    },


    getAllProducts: async () => {

        try {

            const Allproduct = await dbProduct.find().lean().exec()

            return Allproduct
        } catch (err) {
            console.error('Error retrieving user:', err);
        }


    },
    getOneProductbyId: async (req) => {

        let id = req.params.id




        try {
            const getOneProduct = await dbProduct.findOne({ _id: id }).lean().exec()
            console.log(getOneProduct,);
            console.log("found one product");
            return getOneProduct
        } catch (err) {
            console.error('Error retrieving user:', err);
        }

    },
    updateOneProductById: async (req) => {

        let id = req.params.id;


        let updateImage = ""
        if (req.file && req.body.image) {
            const oldImage = req.body.image
            updateImage = req.file.filename;
            console.log(oldImage);
            console.log("old image");
            console.log(updateImage);
            console.log("new image");
            fs.unlink("public/images/" + oldImage, (err) => {
                if (err) {
                    console.log("image path doesn't deleted")
                } else {
                    console.log("Successfully deleted the file.")
                }
            })


        } else {

            updateImage = req.body.image

        }

        const updatedProduct = {
            Productname: req.body.name,
            category: req.body.category,
            price: req.body.price,
            description: req.body.description,
            image: updateImage
        }

        await dbProduct.updateOne({ _id: id }, updatedProduct).exec()
            .then((result) => {
                console.log("result start");

            })
            .catch((error) => {

                console.error("Internal server error" + error);
            });

        console.log("updated complete");



    },

    // delete products

    deleteProductByid: async (req) => {

        let id = req.params.id;

        await dbProduct.deleteOne({ _id: id }).then((result) => {

            console.log("image deleted with all file");

            fs.unlink("public/images/" + result.image, (err) => {
                if (err) {
                    console.log("image path doesn't deleted")
                } else {
                    console.log("Successfully deleted the file .")
                }
            })


        })

    }



}

