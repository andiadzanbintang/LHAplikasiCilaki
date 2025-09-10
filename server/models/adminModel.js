const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define regex pattern for email validation
const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const adminSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true,  
    unique: true, 
    match: [emailRegexPattern, "Email format is invalid"] 
  },
  password: { 
    type: String, 
    required: true, 
    minLength: [8, "Password must be at least 8 characters"], 
    select: false 
  },
  role: { type: String, default: 'admin' }
}, { timestamps: true }); 

// Pre-save hook to hash the password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare input password with hashed password
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to check if an admin with given field already exists
adminSchema.statics.doesNotExist = async function (field) {
  return await this.where(field).countDocuments() === 0;
};

module.exports = mongoose.model('Admin', adminSchema);
