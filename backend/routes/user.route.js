import express from "express";
import { editProfile, follower, following, followOrUnfollow, getProfile, getSuggestedUsers, login, logout, register, search } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePhoto'), editProfile);
router.route('/search').get(isAuthenticated, search);
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);
router.route('/followorunfollow/:id').get(isAuthenticated, followOrUnfollow);
router.route('/following').get(isAuthenticated, following);
router.route('/follower').get(isAuthenticated, follower);



export default router;