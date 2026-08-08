// import httpStatus from 'http-status';

// import bcrypt, {hash} from 'bcrypt';

// import {User} from "../models/user.model.js";

// import crypto from "crypto";

// import {Meeting} from "../models/meeting.model.js";



// const login = async (req,res) =>{
//     const {username, password} = req.body;
//     if(!username || !password){
//         return res.status(httpStatus.BAD_REQUEST).json({message:"Please Provide"})
//  } 
    
//     try{
//          const user = await User.findOne({username});
//          if(!user){
//             return res.status(httpStatus.NOT_FOUND).json({message: "User not found"});
//          }

         
//     let isPasswordCorrect = await bcrypt.compare(password, user.password)

//          if(isPasswordCorrect){
//             let token  = crypto.randomBytes(20).toString("hex");
//             user.token = token;
//             await user.save();
//             return res.status(httpStatus.OK).json({token: token})

//          }else{
//             return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid Username or password"})
//          }



//     } catch(e){
//         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something went wrong ${e}`})

//     } 


// }





// const register = async (req,res) =>{
//     const {name, username, password} = req.body;
//     try{
//         const existingUser = await User.findOne({username});
//         if(existingUser){
//             return res.status(httpStatus.FOUND).json({message: "User already exists"});
//         } 

//         const hashedPassword = await bcrypt.hash(password,10);
//         const newUser = new User({
//             name: name,
//             username: username,
//             password: hashedPassword
//         });
//         await newUser.save();
//         res.status(httpStatus.CREATED).json({message: "User Registered"})

//     } catch(e) {
//         res.json({message: `Something went wrong ${e}`});

//     }
// }
//  const getUserHistory = async (req,res) => {
//     const {token} = req.query;

//     try{
//         const user = await User.findOne({token: token});
//         const meetings = await Meeting.find({user_id: user.username});
//       res.json(meetings)
//     } catch (e){
//         res.json({message: `Something went wrong ${e}`});
//     }
//  }

// const  addToHistory = async (req,res) =>{
//     const {token, meeting_code } = req.body;

//     try{
//         const user = await User.findOne({token: token});

//         const newMeeting = new Meeting({
//             user_id: user.username,
//             meetingCode: meeting_code
//         })

//         await newMeeting.save();
//         res.status(httpStatus.CREATED).json({message: "Added code to history"})
//     } catch (e){
//         res.json({message: `Something went wrong ${e}`})
//     }
// }





// export {login, register, getUserHistory, addToHistory}






// import httpStatus from 'http-status';
// import bcrypt from 'bcrypt';
// import { User } from "../models/user.model.js";
// import crypto from "crypto";
// import { Meeting } from "../models/meeting.model.js";

// const login = async (req, res) => {
//     const { username, password } = req.body;

//     if (!username || !password) {
//         return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
//     }

//     try {
//         const user = await User.findOne({ username });

//         const isPasswordCorrect = user ? await bcrypt.compare(password, user.password) : false;

//         if (!user || !isPasswordCorrect) {
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
//         }

//         const token = crypto.randomBytes(20).toString("hex");
//         user.token = token;
//         await user.save();

//         return res.status(httpStatus.OK).json({ token });

//     } catch (e) {
//         console.error(e);
//         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
//     }
// };

// const register = async (req, res) => {
//     const { name, username, password } = req.body;

//     if (!name || !username || !password) {
//         return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide name, username and password" });
//     }

//     try {
//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//             return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({
//             name,
//             username,
//             password: hashedPassword
//         });

//         await newUser.save();
//         return res.status(httpStatus.CREATED).json({ message: "User registered" });

//     } catch (e) {
//         console.error(e);
//         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
//     }
// };

// const getUserHistory = async (req, res) => {
//     const { token } = req.query;

//     if (!token) {
//         return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
//     }

//     try {
//         const user = await User.findOne({ token });
//         if (!user) {
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
//         }

//         const meetings = await Meeting.find({ user_id: user.username });
//         return res.status(httpStatus.OK).json(meetings);

//     } catch (e) {
//         console.error(e);
//         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
//     }
// };

// const addToHistory = async (req, res) => {
//     const { token, meeting_code } = req.body;

//     console.log("Token received:", JSON.stringify(token));

//     try {
//         const user = await User.findOne({ token });
//         console.log("User found:", user);

//         if (!user) {
//             const allTokens = await User.find({}, "username token");
//             console.log("All users/tokens in DB:", allTokens);
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
//         }

//         const newMeeting = new Meeting({
//             user_id: user.username,
//             meetingCode: meeting_code
//         });

//         await newMeeting.save();
//         return res.status(httpStatus.CREATED).json({ message: "Added code to history" });

//     } catch (e) {
//         console.error(e);
//         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
//     }
// };

// export { login, register, getUserHistory, addToHistory };



import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import { User } from "../models/user.model.js";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });

        const isPasswordCorrect = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({ token });

    } catch (e) {
        console.error(e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide name, username and password" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered" });

    } catch (e) {
        console.error(e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.status(httpStatus.OK).json(meetings);

    } catch (e) {
        console.error(e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting_code are required" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();
        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });

    } catch (e) {
        console.error(e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

export { login, register, getUserHistory, addToHistory };