import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import  {agendaa}  from "../utils/agenda.js";
import { Story } from "../models/storyModel.js"
import { Notification } from "../models/notificationModel.js";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        if (!image) return res.status(400).json({ message: 'Image required' });

        // image upload 
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        // buffer to data uri
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });
        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'New post added',
            post,
            success: true,
        })

    } catch (error) {
        console.log(error);
    }
}
export const getAllPost = async (req, res) => {
  try {
    const userId = req.id;

    // Get all posts
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

  
    const user = await User.findById(userId).select("bookmarks");
    const bookmarkedIds = user.bookmarks.map((id) => id.toString());

    // Add isBookmarked flag to each post
    const postsWithBookmarkStatus = posts.map((post) => {
      const isBookmarked = bookmarkedIds.includes(post._id.toString());
      return { ...post.toObject(), isBookmarked };
    });

    return res.status(200).json({
      posts: postsWithBookmarkStatus,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username, profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username, profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const likePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id; 
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        // like logic started
        await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
        await post.save();

        // implement socket io for real time notification
        const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture');
         
        const postOwnerId = post.author.toString();
        if(postOwnerId !== likeKrneWalaUserKiId){
            // emit a notification event
            const notification = {
                type:'like',
                userId:likeKrneWalaUserKiId,
                userDetails:user,
                postId,
                message:'Your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
        }

        return res.status(200).json({message:'Post liked', success:true});
    } catch (error) {

    }
}
export const dislikePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        // like logic started
        await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
        await post.save();

        // implement socket io for real time notification
        const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture');
        const postOwnerId = post.author.toString();
        if(postOwnerId !== likeKrneWalaUserKiId){
            // emit a notification event
            const notification = {
                type:'dislike',
                userId:likeKrneWalaUserKiId,
                userDetails:user,
                postId,
                message:'Your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
        }



        return res.status(200).json({message:'Post disliked', success:true});
    } catch (error) {

    }
}
export const addComment = async (req,res) =>{
    try {
        const postId = req.params.id;
        const commentKrneWalaUserKiId = req.id;

        const {text} = req.body;

        const post = await Post.findById(postId);

        if(!text) return res.status(400).json({message:'text is required', success:false});

        const comment = await Comment.create({
            text,
            author:commentKrneWalaUserKiId,
            post:postId
        })

        await comment.populate({
            path:'author',
            select:"username profilePicture"
        });
        
        post.comments.push(comment._id);
        await post.save();

        return res.status(201).json({
            message:'Comment Added',
            comment,
            success:true
        })

    } catch (error) {
        console.log(error);
    }
};
export const getCommentsOfPost = async (req,res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({post:postId}).populate('author', 'username profilePicture');

        if(!comments) return res.status(404).json({message:'No comments found for this post', success:false});

        return res.status(200).json({success:true,comments});

    } catch (error) {
        console.log(error);
    }
}
export const deletePost = async (req,res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'Post not found', success:false});

        // check if the logged-in user is the owner of the post
        if(post.author.toString() !== authorId) return res.status(403).json({message:'Unauthorized'});

        // delete post
        await Post.findByIdAndDelete(postId);

        // remove the post id from the user's post
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        // delete associated comments
        await Comment.deleteMany({post:postId});

        return res.status(200).json({
            success:true,
            message:'Post deleted'
        })

    } catch (error) {
        console.log(error);
    }
}
export const bookmarkPost = async (req,res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message:'Post not found', success:false});
        
        const user = await User.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            // already bookmarked -> remove from the bookmark
            await user.updateOne({$pull:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'unsaved', message:'Post removed from bookmark', success:true});

        }else{
            // bookmark krna pdega
            await user.updateOne({$addToSet:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({type:'saved', message:'Post bookmarked', success:true});
        }

    } catch (error) {
        console.log(error);
    }
}

export const schedulee = async (req, res) => {
    
  
    try {

        
      const { scheduleAt } = req.body;

      
      
  
      if (!req.file) {
        return res.status(400).json({ message: "No media uploaded!" });
      }

    

      let scheduledTime ;

      

      if(req.body.scheduleStatus==='now'){
        scheduledTime = new Date();
      }else{
        scheduledTime = new Date(scheduleAt);
      }
  
      const image = req.file;

      // Optimize image using Sharp
      const optimizedImageBuffer = await sharp(image.buffer)
        .resize({ width: 800, height: 800, fit: "inside" })
        .toFormat("jpeg", { quality: 80 })
        .toBuffer();
  
      // Convert buffer to Data URI
      const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`;
      const cloudResponse = await cloudinary.uploader.upload(fileUri);
      const mediaUrl = cloudResponse.secure_url;
  
      // Convert and validate scheduledAt
      
      if (isNaN(scheduledTime.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled time format!" });
      }
  
      const newStory = new Story({
        userId: req.id,
        mediaUrl,
        scheduledAt: scheduledTime,
        expiresAt: new Date(scheduledTime.getTime() + 86400000), // 24-hour expiry

      });
  
      await newStory.save();
  
    //   console.log("Scheduled At:", newStory.scheduledAt);
    //   console.log("Story ID:", newStory._id);
  
      const now = new Date();
  
      // Check if agendaa is initialized
      if (!agendaa) {
        return res.status(500).json({ message: "Agenda instance not initialized!" });
      }
  
      // Ensure the job "publish story" is defined
      const jobDefinitions = await agendaa._definitions;
      if (!jobDefinitions["publish story"]) {
        return res.status(500).json({ message: "Job 'publish story' is not defined in Agenda!" });
      }

      
      
  
      if (newStory.scheduledAt > now) {
        await agendaa.schedule(newStory.scheduledAt, "publish story", { storyId: newStory._id });
        res.status(201).json({ message: "Story scheduled successfully", newStory });
      } else {
        // Post immediately
        await agendaa.now("publish story", { storyId: newStory._id });
        newStory.createdAt = now;
        await newStory.save();
        res.status(201).json({ message: "Story posted immediately", newStory });
      }
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  export const seestory = async (req, res) => {
    try {
      const userId = req.id;
      const now = new Date();
  
      const user = await User.findById(userId).select("following");
      const followingIds = user.following || [];
  
      // Fetch stories (user + following), posted and active
      const stories = await Story.find({
        userId: { $in: [userId, ...followingIds] },
        scheduledAt: { $lte: now },
        expiresAt: { $gt: now },
      })
        .populate("userId", "username profilePicture") // Get user info
        .sort({ createdAt: -1 });
  
      // Group stories by user
      const grouped = {};
  
      stories.forEach((story) => {
        const uid = story.userId._id.toString();
        if (!grouped[uid]) {
          grouped[uid] = {
            user: story.userId,
            stories: [],
          };
        }
        grouped[uid].stories.push(story);
      });
  
      // Separate user's own stories and following's stories
      const userStories = grouped[userId] ? [grouped[userId]] : [];
      const followingStories = Object.values(grouped).filter(
        (item) => item.user._id.toString() !== userId
      );
  
      res.status(200).json({ userStories, followingStories });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error });
    }
  };

export const getAllNotificationsAndMarkUnreadRead = async (req, res) => {
    try {
      const userId = req.id;
  
      // 1. Fetch ALL notifications (latest first)
      const allNotificationsDocs = await Notification.find({
        toUserId: userId,
      }).sort({ timestamp: -1 });
  
      // 2. Count unread notifications separately
      const unreadCount = await Notification.countDocuments({
        toUserId: userId,
        read: false,
      });
  
      // 3. Convert to plain objects before marking as read
      const allNotifications = allNotificationsDocs.map(n => n.toObject());
  
      // 4. Send notifications + unread count to frontend
      res.status(200).json({
        notifications: allNotifications,
        unreadCount,
        success: true,
      });
  
      // 5. Mark all unread as read
      await Notification.updateMany(
        { toUserId: userId, read: false },
        { $set: { read: true } }
      );
  
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
 };

 export const count= async (req, res) => {
    try {
      const userId = req.id;
  
      const unreadCount = await Notification.countDocuments({
        toUserId: userId,
        read: false,
      });
  
      res.status(200).json({
        unreadCount,
        success: true,
      });
  
    } catch (error) {
      console.error("Error counting unread notifications:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  