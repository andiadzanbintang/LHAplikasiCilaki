require("dotenv").config();
const express = require("express");
const { submitPairwiseComparison, calculateAHPWeights, getAllWeights } = require("../controllers/formController");
const router = express.Router();

router.post('/submit', submitPairwiseComparison)
router.get('/calculate', calculateAHPWeights)
router.get('/getAllResult', getAllWeights)

module.exports = router 