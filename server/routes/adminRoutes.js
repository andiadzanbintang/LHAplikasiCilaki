require('dotenv').config()
const express = require('express');
const router = express.Router();

const { 
loginAdmin, 
logoutAdmin, 
getIteration, 
editIteration, 
getIndicators,
addIndicator,
editIndicator,
deleteIndicator,
getAllComparisons,
deleteComparison,
} = require('../controllers/adminController');

// Admin login route
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/getIteration', getIteration);
router.put('/editIteration', editIteration); 

// Indicator routes
router.get('/indicators', getIndicators);
router.post('/indicators', addIndicator);
router.put('/indicators/:id', editIndicator);
router.delete('/indicators/:id', deleteIndicator);

// Comparison routes
router.get('/comparisons', getAllComparisons)
router.delete('/comparisons/:id', deleteComparison)

// Set Iteration
router.get('/getIteration', getIteration)
router.put('/editIteration', editIteration)

module.exports = router
