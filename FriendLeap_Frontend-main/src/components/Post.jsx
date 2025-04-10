import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Bookmark, BookmarkCheck, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { Button } from "./ui/button";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setPosts, setSelectedPost } from "@/redux/postSlice";
import { Badge } from "./ui/badge";
import PostInstance from "@/utils/PostInstance";
import { useSocket } from "@/socketContext";

const Post = ({ post }) => {
  
  
  const socket = useSocket();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);
  const [liked, setLiked] = useState(post.likes.includes(user?._id));
  const [postLike, setPostLike] = useState(post.likes.length);
  const [comments, setComments] = useState(post.comments || []);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);

  const dispatch = useDispatch();


  

  const likeOrDislikeHandler = async () => {
    try {
      const action = liked ? "dislike" : "like";
     
      const res = await PostInstance.get(`/${post._id}/${action}`);

        if(res.data.message=="Post liked"){
        
          socket.emit("freindsRelatedNotification", {
            toUserId:post.author._id ,
            fromUserId: user._id,
            fromUserName: user.username,
            type:"Post Liked"
        });

        }
      
     
      if (res.data.success) {
        setPostLike((prev) => liked ? prev - 1 : prev + 1);
        setLiked(!liked);

        const updatedPosts = posts.map((p) =>
          p._id === post._id
            ? {
                ...p,
                likes: liked
                  ? p.likes.filter((id) => id !== user._id)
                  : [...p.likes, user._id],
              }
            : p
        );
        dispatch(setPosts(updatedPosts));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to like/dislike post");
      console.error(error);
    }
  };

  const postCommentHandler = async () => {
    try {
      const res = await PostInstance.post(`/${post._id}/comment`, { text });
     
      if (res.data.success) {

        socket.emit("freindsRelatedNotification", {
          toUserId:post.author._id ,
          fromUserId: user._id,
          fromUserName: user.username,
          type:"Comment on Post"
      });

        setComments((prev) => [...prev, res.data.comment]);
        const updatedPosts = posts.map((p) =>
          p._id === post._id
            ? { ...p, comments: [...p.comments, res.data.comment] }
            : p
        );
        dispatch(setPosts(updatedPosts));
        setText("");
        toast.success("Comment added");
      }
    } catch (err) {
      toast.error("Failed to post comment");
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await PostInstance.post(`/${post._id}/comment/all`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (error) {
      toast.error("Could not load comments");
    }
  };

  const openCommentDialog = () => {
    dispatch(setSelectedPost(post));
    fetchComments();
    setOpen(true);
  };

  const toggleBookmarkHandler = async () => {
    try {
      const res = await PostInstance.get(`/${post._id}/bookmark`);
      if (res.data.success) {
        setBookmarked(!bookmarked);

        const updatedPosts = posts.map((p) =>
          p._id === post._id
            ? {
                ...p,
                bookmarks: bookmarked
                  ? p.bookmarks?.filter((id) => id !== user._id)
                  : [...(p.bookmarks || []), user._id],
              }
            : p
        );
        dispatch(setPosts(updatedPosts));
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Bookmark action failed");
      console.error(err);
    }
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-4 max-w-md mx-auto transition-all hover:shadow-lg">
      {/* Post Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.author?.profilePicture} alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-gray-900">{post.author?.username}</h1>
            {user?._id === post.author?._id && (
              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                Author
              </Badge>
            )}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <MoreHorizontal className="cursor-pointer hover:text-gray-500 transition duration-200" />
          </DialogTrigger>
          <DialogContent className="flex flex-col items-center text-sm text-center">
            {post.author?._id !== user?._id && (
              <Button variant="ghost" className="w-fit text-red-500 font-bold hover:bg-gray-100">
                Unfollow
              </Button>
            )}
            <Button variant="ghost" className="w-fit hover:bg-gray-100">
              Add to favorites
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Post Image */}
      <div className="relative my-4">
        <img className="rounded-lg w-full object-cover aspect-square z-0" src={post.image} alt="Post" />
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between my-3">
        <div className="flex items-center gap-4">
          {liked ? (
            <FaHeart
              onClick={likeOrDislikeHandler}
              size={24}
              className="cursor-pointer text-red-600 hover:scale-110 transition"
            />
          ) : (
            <FaRegHeart
              onClick={likeOrDislikeHandler}
              size={22}
              className="cursor-pointer hover:text-gray-600 transition duration-200"
            />
          )}
          <MessageCircle
            onClick={openCommentDialog}
            className="cursor-pointer hover:text-gray-600 transition duration-200"
          />
          <Send className="cursor-pointer hover:text-gray-600 transition duration-200" />
        </div>
        {bookmarked ? (
          <BookmarkCheck
            className="cursor-pointer text-blue-600 hover:text-blue-700 transition"
            onClick={toggleBookmarkHandler}
          />
        ) : (
          <Bookmark
            className="cursor-pointer hover:text-gray-600 transition"
            onClick={toggleBookmarkHandler}
          />
        )}
      </div>

      {/* Like Count */}
      <span className="font-medium block mb-2 text-gray-800">{postLike} likes</span>

      {/* Caption */}
      <p className="text-gray-700">
        <span className="font-medium mr-2">{post.author?.username}</span>
        {post.caption}
      </p>

      {/* View Comments */}
      {comments.length > 0 && (
        <span
          onClick={openCommentDialog}
          className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition"
        >
          View all {comments.length} comments
        </span>
      )}

      {/* Stylish Modal for Comments */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md h-[80vh] p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">Comments</h2>
              <button
                className="text-sm text-red-500 hover:text-red-600 font-medium transition"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
              {comments.length > 0 ? (
                comments.map((c, idx) => (
                  <div key={idx} className="mb-2 border-b pb-1 text-sm">
                    <span className="font-medium text-gray-800">{c.author?.username}</span>
                    <p className="text-gray-700">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}
            </div>

            <div className="pt-2 mt-2 border-t">
              <input
                type="text"
                placeholder="Add a comment..."
                value={text}
                onChange={(e) => setText(e.target.value.trimStart())}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {text && (
                <button
                  onClick={postCommentHandler}
                  className="mt-2 w-full bg-blue-500 text-white py-2 rounded-md text-sm hover:bg-blue-600 transition"
                >
                  Post Comment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment Input Inline */}
      <div className="flex items-center justify-between mt-3">
        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value.trimStart())}
          className="outline-none text-sm w-full p-2 border-b border-gray-300 focus:border-gray-500 transition duration-200"
        />
        {text && (
          <span
            onClick={postCommentHandler}
            className="text-blue-500 cursor-pointer font-medium hover:text-blue-600 transition duration-200"
          >
            Post
          </span>
        )}
      </div>
    </div>
  );
};

export default Post;
