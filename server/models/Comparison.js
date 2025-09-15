const mongoose = require('mongoose');

const pairwiseSchema = new mongoose.Schema({
  criteria_1: { type: String, required: true }, // Kriteria pertama yang dibandingkan
  criteria_2: { type: String, required: true }, // Kriteria kedua yang dibandingkan
  value: { type: Number, required: true }        // Nilai perbandingan dari criteria_1 terhadap criteria_2
});

const levelSchema = new mongoose.Schema({
  comparison_type: { type: String, required: true, enum: ["criteria", "alternatives"], default:"criteria" }, // Jenis perbandingan
  criteria: [{ type: String }],  // Daftar kriteria yang dibandingkan dalam level ini
  pairwise_comparison: [pairwiseSchema], // Array berisi perbandingan berpasangan
  parent: { type: String }        // Nama parent (untuk level 2 dan 3)
});

// Skema utama untuk menyimpan keseluruhan perbandingan hierarki AHP
const comparisonSchema = new mongoose.Schema({
  iteration:{type:Number, required:true},
  name: { type: String, required: true }, 
  title: { type: String, required: true },     
  instansi:{type:String, required:true},
  level_1: levelSchema,                          // Level 1: Perbandingan IFE dan ISL
  level_2: [levelSchema],                        // Array untuk menyimpan level 2: Finansial vs Ekonomi, Sosial vs Lingkungan
  level_3: [levelSchema]                         // Array untuk menyimpan level 3: Perbandingan antar indikator di setiap sub-kriteria
});
 
module.exports = mongoose.model('Comparison', comparisonSchema);
