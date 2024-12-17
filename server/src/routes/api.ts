import validateUser from "../middleware/middleware";
const express = require('express');
const userController = require('../controllers/usercontroller')
const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/getallusers', validateUser, userController.getAllUsers);
router.post('/getgamestats', validateUser, userController.getGameStats);
router.post('/getuserdata', validateUser, userController.getUserData);
// ... other routes for different controllers

module.exports = router;