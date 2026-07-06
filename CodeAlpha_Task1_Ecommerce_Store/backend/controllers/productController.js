const Product = require("../models/Product");

const getProducts = async (req, res) => {
    try {
        console.log("GET PRODUCTS HIT");

        const products = await Product.find();

        res.status(200).json(products);
    }
    catch(error){
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {

        const product = await Product.create(req.body);

        res.status(201).json(product);

    } catch(error){

        res.status(500).json({
            message:error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getProducts,
    createProduct,
    getProductById
};