const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        // unique: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});

const categoryModel = mongoose.model('Category', categorySchema);

module.exports = categoryModel;