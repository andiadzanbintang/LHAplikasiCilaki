const AdminModel = require('../models/adminModel');
const IndicatorModel = require('../models/indicatorModel')
const AHPResult = require("../models/resultModel");
const ComparisonModel = require('../models/Comparison');
const FormConfig = require('../models/formConfig');
const jwt = require('jsonwebtoken');
const mongoSanitize = require('mongo-sanitize');
const createPairwiseMatrix = require('./formController').createPairwiseMatrix;
const calculateMeanMatrix = require('./formController').calculateMeanMatrix;
const normalizeMatrix = require('./formController').normalizeMatrix;
const calculateWeights = require('./formController').calculateWeights;
const filterPairsFor = require('./formController').filterPairsFor;
require('dotenv').config();

// Login
const loginAdmin = async(req, res) => {
    try {
      // Sanitize input
      const { email, password } = mongoSanitize(req.body);
  
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." }); 
      }
  
      // Find admin by email
      const admin = await AdminModel.findOne({ email }).select("+password");
      if (!admin) {
        return res.status(404).json({ message: "Admin not found." });
      }
  
      // Check if password matches
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials." });
      }
  
      // Create JWT token
      const token = jwt.sign(
        { id: admin._id, role: admin.role, email: admin.email},
        process.env.ADMIN_JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      try {
        // Send token in cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',  // Adding SameSite attribute for CSRF protection
          maxAge: 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({status:200,  message: "Login successful." });
      } catch (error) {
        console.error("Something went wrong", error)
        return res.status(500).json({status:500, message:"Something went wrong"})
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({status:500, message: "Server error." });
    }
}

// Logout
const logoutAdmin = async (req, res) => {
    try {
  
      // Clear cookie regardless of the presence of a token
      res.clearCookie("token", { path: "/" });
      if (req.session) {
        req.session.destroy();
      }
  
      return res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
      console.error("Something went wrong", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

const getIteration = async (req, res) => {
    try {
      // const admin = req.admin;
      // if (!admin) {
      //   return res.status(401).json({ status: 401, message: "Unauthorized" });
      // }
  
      const iterationData = await FormConfig.findOne(); // Ambil dokumen pertama
      if (!iterationData) {
        return res.status(404).json({
          status: 404,
          message: "Iteration not found",
        });
      }
  
      return res.status(200).json({
        status: 200,
        message: "Success",
        iteration: iterationData.iteration, // Pastikan hanya kirim nilai iteration
      });
    } catch (error) {
      console.error("Something went wrong:", error);
      return res.status(500).json({
        status: 500,
        message: "Something went wrong",
      });
    }
  };

// Endpoint untuk edit iterasi
const editIteration = async (req, res) => {
  try {
    // const admin = req.admin; // Pastikan user adalah admin
    // if (!admin) {
    //   return res.status(401).json({ status: 401, message: "Unauthorized" });
    // }

    const { iteration } = req.body;

    // Validasi: iteration harus angka positif
    if (!Number.isInteger(iteration) || iteration < 0) {
      return res.status(400).json({
        status: 400,
        message: "Iteration must be a positive integer.",
      });
    }

    // Cari dan perbarui iterasi di database
    const updatedConfig = await FormConfig.findOneAndUpdate(
      {}, // Update dokumen pertama
      { iteration },
      { new: true, upsert: true } // Buat dokumen baru jika tidak ada
    );

    return res.status(200).json({ 
      status: 200,
      message: "Iteration updated successfully.",
      iteration: updatedConfig.iteration,
    });
  } catch (error) {
    console.error("Error updating iteration:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong.",
    });
  }
};

// Bagian indikator
const IncreamentIteration = async () => {
  try {
    const config = await FormConfig.findOneAndUpdate(
      {},
      { $inc: { iteration: 1 } },
      { new: true, upsert: true }
    );
    return config.iteration;
  } catch (error) {
    console.error("Error incrementing iteration:", error);
    throw new Error("Could not increment iteration");
  }
}; 

const getIndicators = async (req, res) => {
  try {
    const indicators = await IndicatorModel.find();
    if(!indicators || indicators.length === 0){
       return res.status(404).json({
        status: 404,
        message: "No indicators found",
        data: []
      });
    } else {
      return res.status(200).json({
        status:200, 
        data: indicators
      })
    }
  } catch (error) {
    res.status(500).json({ status:500, message: "Server error" });
  }
}

const addIndicator = async (req, res) => {
  try {
    const { name, description, category } = mongoSanitize(req.body);
    if (!name || !description || !category) {
      return res.status(400).json({ status:400, message: "All fields are required" });
    }
    const newIndicator = new IndicatorModel({ name, description, category });
    await newIndicator.save();
    await IncreamentIteration(); // Increment iteration setiap ada perubahan indikator
    res.status(201).json({ status:201, message: "Indicator added successfully", data: newIndicator });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status:400, message: "Indicator name must be unique" });
    }
    res.status(500).json({ status:500, message: "Server error" });
  } 
}

const editIndicator = async (req, res) => {
  try {
    const { id } = mongoSanitize(req.params);
    const { name, description, category } = mongoSanitize(req.body);
    if (!name || !description || !category) {
      return res.status(400).json({ status:400, message: "All fields are required" });
    }
    const updatedIndicator = await IndicatorModel.findByIdAndUpdate(
      id,
      { name, description, category },
      { new: true, runValidators: true }
    );
    if (!updatedIndicator) {
      return res.status(404).json({ status:404, message: "Indicator not found" });
    }
    await IncreamentIteration(); // Increment iteration setiap ada perubahan indikator
    res.status(200).json({ status:200, message: "Indicator updated successfully", data: updatedIndicator });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status:400, message: "Indicator name must be unique" });
    }
    res.status(500).json({ status:500, message: "Server error" });
  }
}

const deleteIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedIndicator = await IndicatorModel.findByIdAndDelete(id);
    if (!deletedIndicator) {
      return res.status(404).json({ status:404, message: "Indicator not found" });
    }
    await IncreamentIteration(); // Increment iteration setiap ada perubahan indikator
    res.status(200).json({ status:200, message: "Indicator deleted successfully" });
  } catch (error) {
    res.status(500).json({ status:500, message: "Server error" });
  }
}

// Bagian Evaluasi Penilaian
const getAllComparisons = async (req, res) => {
  try {
    const comparisons = await ComparisonModel.find();
    if (!comparisons?.length) return res.status(404).json({status:404, message: "No comparisons found", data: [] });
    res.status(200).json({ status:200, message: "success", data: comparisons });
  } catch (error) {
    console.error("getAllComparisons error:", error);
    res.status(500).json({
      status:500, message: "An error occurred while fetching comparisons.",
    });
  }
};

const deleteComparison = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedComparison = await ComparisonModel.findByIdAndDelete(id);
    if (!deletedComparison) {
      return res.status(404).json({ status:404, message: "Comparison not found" });
    }

    // Recalculate AHP untuk iteration yang terkait
    const iteration = deletedComparison.iteration;
    await recalculateAHP(iteration);

    res.status(200).json({ status:200, message: "Comparison deleted successfully" });
  } catch (error) {
    res.status(500).json({ status:500, message: "Server error" });
  } 
}

// di atas, sebelum module.exports
const recalculateAHP = async (iteration) => {
  const allIndicators = await IndicatorModel.find({}, { name: 1, category: 1 }).lean();
  const IFE_KEYS = allIndicators.filter((x) => x.category === "IFE").map((x) => x.name);
  const ISL_KEYS = allIndicators.filter((x) => x.category === "ISL").map((x) => x.name);
  const IFE_SET = new Set(IFE_KEYS);
  const ISL_SET = new Set(ISL_KEYS);

  const forms = await ComparisonModel.find({ iteration });
  if (!forms?.length) {
    // Kalau kosong, hapus AHPResult untuk iteration ini
    await AHPResult.deleteOne({ iteration });
    return null;
  }

  const level3MatricesIFE = forms.map((f) => {
    const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
    const pairsIFE = filterPairsFor(allPairs, IFE_SET);
    return createPairwiseMatrix(pairsIFE, IFE_KEYS);
  });

  const level3MatricesISL = forms.map((f) => {
    const allPairs = f.level_3?.[0]?.pairwise_comparison || [];
    const pairsISL = filterPairsFor(allPairs, ISL_SET);
    return createPairwiseMatrix(pairsISL, ISL_KEYS);
  });

  const meanIFE = calculateMeanMatrix(level3MatricesIFE);
  const normIFE = normalizeMatrix(meanIFE);
  const wIFE = calculateWeights(normIFE);

  const meanISL = calculateMeanMatrix(level3MatricesISL);
  const normISL = normalizeMatrix(meanISL);
  const wISL = calculateWeights(normISL);

  const level3Weights = {};
  IFE_KEYS.forEach((k, i) => (level3Weights[k] = wIFE?.[i] ?? 0));
  ISL_KEYS.forEach((k, i) => (level3Weights[k] = wISL?.[i] ?? 0));

  const level1Weights = { IFE: 1, ISL: 1 };
  const level2Weights = { Financial: 1, Economy: 1, Social: 1, Environment: 1 };

  await AHPResult.findOneAndUpdate(
    { iteration },
    { iteration, level1Weights, level2Weights, level3Weights },
    { upsert: true, new: true }
  );

  return { iteration, level1Weights, level2Weights, level3Weights };
};




module.exports = { 
  loginAdmin, 
  logoutAdmin , 
  getIteration, 
  editIteration,
  getIndicators,
  addIndicator,
  editIndicator,
  deleteIndicator,
  getAllComparisons,
  deleteComparison,
};