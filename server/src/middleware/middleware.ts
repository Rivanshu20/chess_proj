const jwt = require('jsonwebtoken');
const validateUser = async (req, res, next) => {
    try {
        
        if (req.headers['authorization']) {
            const authHeader = req.headers['authorization'];
            const token = authHeader.split(' ')[1]; // Split the Bearer token
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    res.status(403).send("invalid token"); // Forbidden if token is invalid
                }else{
                    req.user = user; // Set the decoded user object on the request object
                    next(); // Pass control to the next middleware
                }
            });
        }else{
            res.status(404).send("token not found")
        } 
        // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Set token expiration
        // const data = await newUser.save();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

export default validateUser;