import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
} from "../controllers/usersController.js";

const router = express.Router();

// 👥 CRUD utilisateurs
router.get("/", getAllUsers); 
router.post("/", createUser); 
router.put("/:id", updateUser); 
router.delete("/:id", deactivateUser);
router.post("/:id/reset-password", resetUserPassword); 

export default router;
