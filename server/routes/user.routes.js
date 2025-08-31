import { Router } from 'express';
import { RegisterUser, loginUser, logoutUser,getUserProfile} from '../controller/user.controller.js'; 
import { verifyJWT } from '../middleware/auth.middlewares.js'; 

const router= Router();

router.route("/register").post(RegisterUser);
router.route("/login").post(loginUser);

// secure route
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/logout").post(verifyJWT,logoutUser);
export default router