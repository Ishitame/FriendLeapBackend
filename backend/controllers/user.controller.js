import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("HEllo");
        
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "Try different email",
                success: false,
            });
        };
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        };

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // populate each post if in the posts array
        const populatedPosts = await Promise.all(
            user.posts.map( async (postId) => {
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            })
        )
        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts
        }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};
export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};
export const getProfile = async (req, res) => {
    try {
      const profileId = req.params.id;
      const currentUserId = req.id;
  
      const profileUser = await User.findById(profileId)
        .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
        .populate('bookmarks');
  
      let followStatus = null;
  
      if (profileId !== currentUserId) {
        const loggedInUser = await User.findById(currentUserId);
  
        const youFollow = loggedInUser.following.includes(profileId);
        const theyFollow = profileUser.following.includes(currentUserId);
  
        if (youFollow && theyFollow) followStatus = "mutual";
        else if (youFollow) followStatus = "you-follow";
        else if (theyFollow) followStatus = "they-follow";
        else followStatus = "none";
      }
  
   
      const userWithFollow = {
        ...profileUser.toObject(),
        followStatus,
      };
  
      return res.status(200).json({
        user: userWithFollow,
        success: true
      });
  
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", req.file); // Check if file is received

        const { bio, gender } = req.body;
        let profilePictureUrl = null;
        
        // Handle profile photo upload
        if (req.file) {
            const fileUri = getDataUri(req.file); // Convert buffer to Data URI
            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            profilePictureUrl = cloudResponse.secure_url;
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        }

        // Update user profile fields
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePictureUrl) user.profilePicture = profilePictureUrl;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};

export  const search= async (req, res) => {
    try {
        
        
        const { query } = req.query;
    
        const users = await User.find({
            username: { $regex: query, $options: "i" },
            _id: { $ne: req.id }, // Exclude self
          }).select("_id username followers following");
        
          const currentUser = await User.findById(req.id);
        
          const results = users.map((user) => {
            const youFollow = currentUser.following.includes(user._id.toString());
            const theyFollow = user.following.includes(req.id);
        
            return {
              _id: user._id,
              username: user.username,
              status: youFollow && theyFollow
                ? "mutual"
                : youFollow
                ? "you-follow"
                : theyFollow
                ? "they-follow"
                : "none",
            };
          });
        
          res.json(results);

    } catch (err) {
        res.status(500).send(err);
    }
    

};

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId);
      
        const suggested = await User.find({
          _id: { $nin: [...user.following, userId] }, // Exclude followed users & yourself
        }).select("_id username");
      
        res.json(suggested);
    } catch (error) {
        console.log(error);
    }
};

export const followOrUnfollow = async (req, res) => {
    try {
        const followKrneWala = req.id; // patel
        const jiskoFollowKrunga = req.params.id; // shivani
      
        
        
      
        if (followKrneWala === jiskoFollowKrunga) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(followKrneWala);
        const targetUser = await User.findById(jiskoFollowKrunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }
        // mai check krunga ki follow krna hai ya unfollow
        const isFollowing = user.following.includes(jiskoFollowKrunga);

        if (isFollowing) {
            // unfollow logic aye
            
            await Promise.all([
                User.updateOne({ _id: followKrneWala }, { $pull: { following: jiskoFollowKrunga } }),
                User.updateOne({ _id: jiskoFollowKrunga }, { $pull: { followers: followKrneWala } }),
            ])
            return res.status(200).json({ message: 'Unfollowed successfully', success: true });
        } else {
            // follow logic ayega
            await Promise.all([
                User.updateOne({ _id: followKrneWala }, { $push: { following: jiskoFollowKrunga } }),
                User.updateOne({ _id: jiskoFollowKrunga }, { $push: { followers: followKrneWala } }),
            ])
            console.log("success");
            
            return res.status(200).json({ message: 'followed successfully', success: true });
        }
    } catch (error) {
        console.log(error);
    }
}

export const following = async (req, res) => {
    try {
        
    
        if (!req.query.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      const userId = req.query.userId;
  
      const user = await User.findById(userId)
        .populate("following", "_id username followers following");
  
      const results = await Promise.all(
        user.following.map(async (followedUser) => {
          const theyFollow = followedUser.following
            .map(id => id.toString())
            .includes(userId.toString());
  
          return {
            _id: followedUser._id,
            username: followedUser.username,
            status: theyFollow ? "mutual" : "you-follow",
          };
        })
      );
  
      res.json(results);
    } catch (err) {
      console.error("Error fetching following:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  export const follower = async (req, res) => {
    try {

        
        
      if (!req.query.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      const userId = req.query.userId;
  
      const user = await User.findById(userId)
        .populate("followers", "_id username following")
        .select("followers following"); // ensure following is fetched
  
      const userFollowingIds = user.following.map(id => id.toString());
  
      const results = user.followers.map((follower) => {
        const youFollow = userFollowingIds.includes(follower._id.toString());
  
        return {
          _id: follower._id,
          username: follower.username,
          status: youFollow ? "mutual" : "they-follow",
        };
      });
  
      res.json(results);
    } catch (err) {
      console.error("Error fetching followers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  