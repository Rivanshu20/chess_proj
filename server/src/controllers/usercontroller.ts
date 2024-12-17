import User from "../models/userModel";
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
import game from "../utils/games";
async function hashPassword(password, saltRounds = 10) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password'); // Or handle the error differently
    }
}
async function comparePassword(plainTextPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('Error comparing passwords'); // Or handle the error differently
    }
}  
exports.login = async (req, res) => {
    try {
        const userData = req.body
        const exist = await User.findOne({username:userData.username})
        if(!exist){
            throw new Error("user not found")
        }else{
            const match = await comparePassword(userData.password, exist.password)
            if(match){
                const { password, ...safeUser } = exist.toObject(); // use toObject() to ensure you are working with a plain JavaScript object
                const token = jwt.sign(safeUser, process.env.JWT_SECRET, { expiresIn: "1d" }); // Set token expiration
                res.json(token);
            }else{
                throw("Incorrct password")
            }
        }
        // const data = await newUser.save();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
exports.signup = async (req, res) => {
    try {
        const userData = req.body
        userData.password = await hashPassword(userData.password);
        const newUser = new User({
            name:userData.name,
            username:userData.username,
            rating:1000,
            wins:0,
            games:0,
            password:userData.password
        })
        const data = await newUser.save();
        delete userData.password;
        const payload = userData;
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); // Set token expiration
        res.json(token)
    } catch (error) {
        console.error(error);
        res.status(400).send('Internal Server Error');
    }
};
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('username rating')
            .sort({ rating: -1 })
            .limit(10);    
        return res.json(users);
    } catch (error) {
        console.error(error);
        res.status(400).send('Internal Server Error');
    }
};
exports.getGameStats = async (req, res) => {
    try {
        const data = req.body;
        if(!game.games[data.id]){
            res.status(404).send("Game not found")
        }else{
            const gameObj = game.games[data.id];
            if(req.user && (req.user.username == gameObj.whiteName || req.user.username == gameObj.blackName)){
                res.json(gameObj)
            }else{
                res.status(404).send("player dont belong to this game")
            }
            res.json();
        }
    } catch (error) {
        console.error(error);
        res.status(400).send('Internal Server Error');
    }
};
exports.getUserData = async (req, res) => {
    try {
        const data = req.body;
        if(data && data.username){
            const exist = await User.findOne({username: data.username})
            if(!exist){
                throw new Error("NO USER FOUND")
            }else{
                const { password, ...safeUser } = exist.toObject(); // use toObject() to ensure you are working with a plain JavaScript object
                const token = jwt.sign(safeUser, process.env.JWT_SECRET, { expiresIn: '1d' }); // Set token expiration
                res.json(token);
            }
        }else{
            res.status(404).send('username not found');    
        }
    } catch (error) {
        console.error(error);
        res.status(400).send('Internal Server Error');
    }
};
