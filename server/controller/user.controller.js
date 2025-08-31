import { asyncHandler } from "../utils/Asynchandler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

// Generate access token
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// Generate refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken || req.query.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Please login first");
    }
    try{
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id); // Changed from decoded._id to decoded.id
        if(!user){
            throw new ApiError(401, "User not found");
        }
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Invalid refresh token");
        }
        const option = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
        
        // Create user response with businessName field
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            businessName: user.businessName || "", // Ensure businessName is included
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: userResponse,
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed successfully"
                )
            );

    }catch(error){
        throw new ApiError(500, "Something went wrong while refreshing access token");
    }
})

// Register a new user
const RegisterUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    if ([name, email, password].some((field) => typeof field !== "string" || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        email: email.trim().toLowerCase(),
    });

    if (existedUser) {
        throw new ApiError(400, "User already exists with this email");
    }

    const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User not created");
    }

    // Create user response with businessName field (even if empty)
    const userResponse = {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        businessName: createdUser.businessName || "", // Ensure businessName is included
        // Add other fields from your user model if needed
    };

    return res.status(201).json(
        new ApiResponse(201, "User created successfully", userResponse)
    );
});
// login user

const loginUser = asyncHandler(async(req, res, next) => {
    const {email, password} = req.body;

    if([email, password].some((field) => typeof field !== "string" || field.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if(!user){
        throw new ApiError(400, "User does not exist with this email");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Incorrect password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

    const userData = await User.findById(user._id).select("-password -refreshToken");
    
    // Create user response with businessName field (even if empty)
    const userResponse = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        businessName: userData.businessName || "", // Ensure businessName is included
        // Add other fields from your user model if needed
    };

    const option = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200, 
            {
                user: userResponse, // Use the modified response with businessName
                accessToken, 
                refreshToken
            },
            "User logged In Successfully"
        )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
    // The user is already attached to req by verifyJWT middleware
    const user = req.user;
    
    return res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
        // Or if you don't have ApiResponse:
        // { statusCode: 200, data: user, message: "User profile fetched successfully", success: true }
    );
});


// logout user

const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { 
        $unset:{refreshToken: 1}
    },
    {
        new: true
    }
)
const option={
    httpOnly:true,
    secure:process.env.NODE_ENV === "production"
}
return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged Out"))

})
export {RegisterUser,loginUser, refreshAccessToken, logoutUser,getUserProfile };