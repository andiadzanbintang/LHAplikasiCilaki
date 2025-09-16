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

  // 🔧 UBAH: dari field kaku IFE1..IFE12, ISL1..ISL10 → Map dinamis
  // Tetap kompatibel: cukup assign object biasa, Mongoose akan menyimpannya sebagai Map.
  level3Weights: {
    type: Map,
    of: {
      type: Number,
      // (opsional) jaga range 0..1
      validate: {
        validator: (v) => v >= 0 && v <= 1,
        message: 'Level 3 weight harus berada di rentang [0, 1].',
      },
    },
    default: {},
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
