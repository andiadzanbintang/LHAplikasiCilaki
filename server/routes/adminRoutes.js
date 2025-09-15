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
} = require('../controllers/adminController');

// Admin login route
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/getIteration', getIteration);
router.put('/editIteration', editIteration); 

router.get('/indicators', getIndicators);
router.post('/indicators', addIndicator);
router.put('/indicators/:id', editIndicator);
router.delete('/indicators/:id', deleteIndicator);


module.exports = router
