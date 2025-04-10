

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import AxiosInstance from '@/utils/AxiosInstance';
import { toast } from 'sonner';
import { useSocket } from '@/socketContext'

const Profile = () => {
  const socket = useSocket()
  const params = useParams();
  const userId = params.id;
  useGetUserProfile(userId);

  const [activeTab, setActiveTab] = useState('posts');
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState('followers');
  const [popupData, setPopupData] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [followBack, setIsfollowBack] = useState(false);


  const { userProfile, user } = useSelector((store) => store.auth);
  const isLoggedInUserProfile = user?._id === userProfile.user._id;



  

  useEffect(() => {
    if (userProfile && user) {
      const followStatus = userProfile?.user?.followStatus;
  
      if (followStatus === 'you-follow') {
        setIsFollowing(true);
        setIsMutualFollow(false);
      } else if (followStatus === 'mutual') {
        setIsFollowing(true);
        setIsMutualFollow(true);
      }else if(followStatus === 'they-follow'){
        setIsFollowing(false);
      setIsMutualFollow(false);
        setIsfollowBack(true);
      }
       else {
        setIsFollowing(false);
        setIsMutualFollow(false);
      }
    }
  }, [userProfile, user]);
  

  const handleTabChange = (tab) => setActiveTab(tab);
  const displayedPost = activeTab === 'posts' ? userProfile.user.posts : userProfile.user.bookmarks;

  const openPopup = async (type) => {
    setPopupType(type);
    setShowPopup(true);
    try {
      const response = await AxiosInstance.get(`/${type}?userId=${userId}`);
      setPopupData(response.data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`Failed to load ${type}`);
    }
  };

  const handleFollowUnfollow = async (targetUserId) => {
    console.log(targetUserId);
    
    try {

     const res= await AxiosInstance.get(`/followorunfollow/${targetUserId}`);
     console.log(res.data,"follow or unfollow response");
     
      
     
      if(targetUserId)
        {
         socket.emit("freindsRelatedNotification", {
           toUserId: userId,
           fromUserId: user._id,
           fromUserName: user.username,
           type:"folllow"
       });
        }   
      setIsFollowing((prev) => !prev);
      setIsMutualFollow(false); // Force recheck on full reload or refetch
      toast.success(isFollowing ? 'Unfollowed successfully!' : 'Followed successfully!');
    } catch (error) {
      console.error('Error toggling follow/unfollow:', error.response?.data || error.message);
      toast.error('Action failed.');
    }
  };

  return (
    <div className='flex max-w-5xl justify-center mx-auto pl-10'>
      <div className='flex flex-col gap-20 p-8'>
        <div className='grid grid-cols-2'>
          <section className='flex items-center justify-center'>
            <Avatar className='h-32 w-32'>
              <AvatarImage src={userProfile.user.profilePicture} alt='profilephoto' />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </section>
          <section>
            <div className='flex flex-col gap-5'>
              <div className='flex items-center gap-2'>
                <span>{userProfile?.user.username}</span>
                {isLoggedInUserProfile ? (
                  <>
                    <Link to='/account/edit'>
                      <Button variant='secondary' className='hover:bg-gray-200 h-8'>
                        Edit profile
                      </Button>
                    </Link>
                    <Button variant='secondary' className='hover:bg-gray-200 h-8'>View archive</Button>
                    <Button variant='secondary' className='hover:bg-gray-200 h-8'>Ad tools</Button>
                  </>
                ) : isMutualFollow ? (
                  <>
                    <Button variant='secondary' className='h-8' onClick={() => handleFollowUnfollow(userProfile.user._id)}>
                      Freinds
                    </Button>
                    <Button variant='secondary' className='h-8'>Message</Button>
                  </>
                ) : isFollowing ? (
                  <>
                    <Button variant='secondary' className='h-8' onClick={() => handleFollowUnfollow(userProfile.user._id)}>
                      Following
                    </Button>
                    <Button variant='secondary' className='h-8'>Message</Button>
                  </>
                ): followBack ? (
                  <>
                    <Button variant='secondary' className='h-8' onClick={() => handleFollowUnfollow(userProfile.user._id)}>
                     Follow Back
                    </Button>
                    <Button variant='secondary' className='h-8'>Message</Button>
                  </>
                ) : (
                  <Button className='bg-[#0095F6] hover:bg-[#3192d2] h-8' onClick={() => handleFollowUnfollow(userProfile.user._id)}>
                    Follow
                  </Button>
                )}
              </div>

              <div className='flex items-center gap-4'>
                <p><span className='font-semibold'>{userProfile.user.posts?.length || 0} </span>posts</p>
                <p className='cursor-pointer' onClick={() => openPopup('follower')}>
                  <span className='font-semibold'>{userProfile.user.followers?.length || 0} </span>followers
                </p>
                <p className='cursor-pointer' onClick={() => openPopup('following')}>
                  <span className='font-semibold'>{userProfile.user.following?.length || 0} </span>following
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Tab Section */}
        <div className='border-t border-t-gray-200'>
          <div className='flex items-center justify-center gap-10 text-sm'>
            <span className={`py-3 cursor-pointer ${activeTab === 'posts' ? 'font-bold' : ''}`} onClick={() => handleTabChange('posts')}>
              POSTS
            </span>
            <span className={`py-3 cursor-pointer ${activeTab === 'saved' ? 'font-bold' : ''}`} onClick={() => handleTabChange('saved')}>
              SAVED
            </span>
          </div>
          <div className='grid grid-cols-3 gap-1'>
            {displayedPost?.map((post) => (
              <div key={post?._id} className='relative group cursor-pointer'>
                <img src={post.image} alt='postimage' className='rounded-sm my-2 w-full aspect-square object-cover' />
                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <div className='flex items-center text-white space-x-4'>
                    <button className='flex items-center gap-2 hover:text-gray-300'>
                      <Heart />
                      <span>{post?.likes?.length || 0}</span>
                    </button>
                    <button className='flex items-center gap-2 hover:text-gray-300'>
                      <MessageCircle />
                      <span>{post?.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Followers & Following Pop-Up */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className='max-w-md'>
          <DialogHeader className='flex justify-between items-center'>
            <DialogTitle>{popupType === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
            <Button variant='ghost' size='icon' onClick={() => setShowPopup(false)}>
              <X />
            </Button>
          </DialogHeader>
          <div className='flex flex-col space-y-2'>
            {popupData.map((user) => (
              <div key={user?._id} className='flex items-center justify-between p-2 border-b'>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <span className='text-sm'>{user?.username}</span>
                </div>
                <Button variant='outline' onClick={() => handleFollowUnfollow(user._id)} className='text-xs'>
                  Unfollow
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

