const mongoose = require('mongoose');

// Skema utama untuk menyimpan keseluruhan perbandingan hierarki AHP
const configSchema = new mongoose.Schema({
  iteration:{type:Number, required:true, default:0},
}, {timestamps:true});  

module.exports = mongoose.model('Config', configSchema);