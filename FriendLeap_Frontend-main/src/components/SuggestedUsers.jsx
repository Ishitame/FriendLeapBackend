import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner'
import AxiosInstance from '../utils/AxiosInstance';
import { useSocket } from '@/socketContext';

const SuggestedUsers = () => {
  const socket = useSocket()
  const { suggestedUsers,user } = useSelector(store => store.auth);
  console.log(suggestedUsers,"ssssss");
  
  const [loadingIds, setLoadingIds] = useState([]); // Track loading state for each user

  const handleFollow = async (userId) => {
    try {
      setLoadingIds(prev => [...prev, userId]);
    
      const res = await AxiosInstance.get(`/followorunfollow/${userId}`);

      console.log(res.data,"follow or unfollow response");
      
      if(res.data.message==="followed successfully")
       {
        socket.emit("freindsRelatedNotification", {
          toUserId: userId,
          fromUserId: user._id,
          fromUserName: user.username,
          type:"folllow"
      });
       }   
     
      
      toast.success(res?.data?.message || "Followed successfully");
    } catch (error) {
      console.error(error);
  
      // ✅ Show error message from response if available
      const errorMsg = error?.response?.data?.message || "Failed to follow";
      toast.error(errorMsg);
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== userId));
    }
  };

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  return (
    <div className='my-10'>
      <div className='flex items-center justify-between text-sm'>
        <h1 className='font-semibold text-gray-600'>Suggested for you</h1>
        <span className='font-medium cursor-pointer'>See All</span>
      </div>

      {suggestedUsers.map((user) => (
        <div key={user._id} className='flex items-center justify-between my-5'>
          <div className='flex items-center gap-2'>
            <Link to={`/profile/${user._id}`}>
              <Avatar>
                <AvatarImage src={user?.profilePicture} alt="profile" />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <h1 className='font-semibold text-sm'>
                <Link to={`/profile/${user._id}`}>{user?.username}</Link>
              </h1>
              <span className='text-gray-600 text-sm'>{user?.bio || 'Bio here...'}</span>
            </div>
          </div>
          <span
            onClick={() => handleFollow(user._id)}
            className={`text-[#3BADF8] text-xs font-bold cursor-pointer hover:text-[#3495d6] ${loadingIds.includes(user._id) && 'opacity-50 pointer-events-none'}`}
          >
            {loadingIds.includes(user._id) ? 'Following...' : 'Follow'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SuggestedUsers;
