const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
    },
    description:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        enum: ['IFE', 'ISL'],
    }, 
    saran:[{
        user:{type: String},
        message:{type: String},
        createdAt:{type: Date, default: Date.now}
    }]
},{ timestamps: true });

const Indicator = mongoose.model('Indicator', indicatorSchema);

module.exports = Indicator;