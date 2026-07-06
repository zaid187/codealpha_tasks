const express = require("express");

const router = express.Router();

const {
    getProducts,
    createProduct,
    getProductById
} = require("../controllers/productController");

router.get("/", getProducts);

router.post("/", createProduct);

router.get("/:id", getProductById);

module.exports = router;