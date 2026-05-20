import express from 'express';
import { login, forgotPassword, changePassword } from "../controllers/authcontrollers.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post('/login', login);
router.post("/forgot-password", forgotPassword); 
router.post("/change-password", verifyToken, changePassword); 

export default router;


