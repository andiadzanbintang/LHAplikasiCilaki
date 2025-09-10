const mongoose = require('mongoose');

const ahpResultSchema = new mongoose.Schema({
  iteration: {
    type: Number,
    required: true,
    unique: true, // Tidak boleh ada duplikasi iterasi
  },
  level1Weights: {
    IFE: Number,
    ISL: Number,
  },
  level2Weights: {
    Financial: Number,
    Economy: Number,
    Social: Number,
    Environment: Number,
  },
  // Level 3 sesuai kesepakatan: IFE (12) + ISL (10)
  level3Weights: {
    // IFE
    IFE1: Number,
    IFE2: Number,
    IFE3: Number,
    IFE4: Number,
    IFE5: Number,
    IFE6: Number,
    IFE7: Number,
    IFE8: Number,
    IFE9: Number,
    IFE10: Number,
    IFE11: Number,
    IFE12: Number,
    // ISL
    ISL1: Number,
    ISL2: Number,
    ISL3: Number,
    ISL4: Number,
    ISL5: Number,
    ISL6: Number,
    ISL7: Number,
    ISL8: Number,
    ISL9: Number,
    ISL10: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware untuk update waktu terakhir diubah (updatedAt)
ahpResultSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AHPResult', ahpResultSchema);
