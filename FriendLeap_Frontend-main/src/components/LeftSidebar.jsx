    import { Heart, Home, LogOut, MessageCircle, PlusSquare, Search, TrendingUp } from 'lucide-react'
    import React, { useState,useEffect } from 'react'
    import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
    import { toast } from 'sonner'
    import { useNavigate } from 'react-router-dom'
    import { useDispatch, useSelector } from 'react-redux'
    import { setAuthUser } from '@/redux/authSlice'
    import CreatePost from './CreatePost'
    import { setPosts, setSelectedPost } from '@/redux/postSlice'
    import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
    import { Button } from './ui/button'
    import AxiosInstance from '@/utils/AxiosInstance'
    import { X } from 'lucide-react'
    import { useSocket } from '@/socketContext'
import PostInstance from '@/utils/PostInstance'
import { formatDistanceToNow } from "date-fns";


    const LeftSidebar = () => {
        
        const socket = useSocket();
        const navigate = useNavigate();
        const { user } = useSelector(store => store.auth);
        const dispatch = useDispatch();
        const [open, setOpen] = useState(false);
        const [searchOpen, setSearchOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState("");
        const [users, setUsers] = useState([]);
        const [notificationOpen, setNotificationOpen] = useState(false);
        const [notifications, setNotifications] = useState([]);
        const [unreadCount, setUnreadCount] = useState(0);
        const [unreadMessages, setUnreadMessage] = useState(0);


        const fetchNotifications = async () => {
            try {
                const res = await PostInstance.get('/getNotifications');
                console.log(res.data.notifications);
                
                setNotifications(res.data.notifications)
                // setUnreadCount(res.data?.unreadCount || 0);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

      
        useEffect(() => {
            if (!socket) return;
    
          const unreadCount = async ()=> {
            const res = await PostInstance.get('/getUnread');
            console.log(res.data.unreadCount);
            setUnreadCount(res.data.unreadCount)
            
         }    
         
         unreadCount()
    
            socket.on("notification", (data) => {
                
                toast.success("You have a new notification");
                setUnreadCount(prev => prev + 1);
            });
    
            return () => {
                socket.off("notification");
            };
        }, [socket]);


        const logoutHandler = async () => {
            try {
                const res = await AxiosInstance.get('/logout');
                if (res.data.success) {
                    dispatch(setAuthUser(null));
                    dispatch(setSelectedPost(null));
                    dispatch(setPosts([]));
                    navigate("/login");
                    toast.success(res.data.message);
                }
            } catch (error) {
                toast.error(error.response.data.message);
            }
        }

        const sidebarHandler = (textType) => {
            if (textType === 'Logout') {
                logoutHandler();
            } else if (textType === "Create") {
                setOpen(true);
            } else if (textType === "Profile") {
                navigate(`/profile/${user?._id}`);
            } else if (textType === "Home") {
                navigate("/");
            } else if (textType === 'Messages') {
                navigate("/chat");
            } else if (textType === 'Search') {
                setSearchOpen(true);
            }else if (textType === 'Notifications') {
                setNotificationOpen(true);
                fetchNotifications();
            }
        }

        const handleSearch = async (e) => {
            setSearchQuery(e.target.value);
        
            if (e.target.value.trim() === "") {
                setUsers([]);
                return;
            }
            try {
                // console.log(e.target.value);
                
                const res = await AxiosInstance.get(`/search?query=${e.target.value}`);
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching users", error);
            }
        }

        const handleFollow = async (userId,status) => {
            try {
                const res = await AxiosInstance.get(`/followorunfollow/${userId}`);
                
                
                const updatedStatus = res.data.message // "none", "you-follow", "they-follow", "mutual"
                
                console.log(res.data.message);
                
                
                
                toast.success(res.data.message || "Follow status updated");

                    if(updatedStatus==="followed successfully"){
                        socket.emit("freindsRelatedNotification", {
                            toUserId: userId,
                            fromUserId: user._id,
                            fromUserName: user.username,
                            type:"folllow"
                        });
                    
                    }
                
                    // socket.emit("freindsRelatedNotification", {
                    //     toUserId: userId,
                    //     fromUserId: user._id,
                    //     fromUserName: user.username,
                    //     type:updatedStatus
                    // });
                
        
                // Update local state to reflect new status
                const updatedUsers = users.map(u =>
                    u._id === userId ? { ...u, status: updatedStatus } : u
                );
                
                setUsers(updatedUsers);
                
            } catch (error) {
                console.log(error);
                toast.error("Failed to update follow status");
            }
        };
        
        

        const sidebarItems = [
            { icon: <Home />, text: "Home" },
            { icon: <Search />, text: "Search" },
            { icon: <TrendingUp />, text: "Explore" },
            {
              icon: (
                <div className="relative">
                  <MessageCircle />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </div>
              ),
              text: "Messages"
            },
            {
              icon: (
                <div className="relative">
                  <Heart />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              ),
              text: "Notifications"
            },
            { icon: <PlusSquare />, text: "Create" },
            {
              icon: (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.profilePicture} alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              ),
              text: "Profile"
            },
            { icon: <LogOut />, text: "Logout" }
          ];
          
        
        return (
            <div className='fixed top-0 z-10 left-0 px-4 border-r border-gray-300 w-[16%] h-screen'>
                <div className='flex flex-col'>
                    <h1 className='my-8 pl-3 font-bold text-xl'>LOGO</h1>
                    <div>
                        {sidebarItems.map((item, index) => (
                            <div onClick={() => sidebarHandler(item.text)} key={index} className='flex items-center gap-3 relative hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-3'>
                                {item.icon}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <CreatePost open={open} setOpen={setOpen} />

                {searchOpen && (
                    <div className='fixed top-0 left-0 h-full w-[300px] bg-white shadow-lg transition-transform transform translate-x-0 p-4 overflow-y-auto'>
                        <button className='absolute top-2 right-2' onClick={() => setSearchOpen(false)}>
                            <X size={20} />
                        </button>
                        <h2 className='text-lg font-bold mb-2'>Search Users</h2>
                        <input type='text' placeholder='Search...' value={searchQuery} onChange={handleSearch} className='w-full p-2 border rounded-lg' />
                        <div className='mt-3'>
                        {users.length > 0 ? (
    users.map(user => (
        <div key={user._id} className='flex items-center justify-between p-2 border-b'>
        <div 
            className='flex items-center gap-2 cursor-pointer hover:underline'
            onClick={() => navigate(`/profile/${user._id}`)}
        >
            <Avatar>
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <p>{user.username}</p>
        </div>

        {user.status === 'they-follow' && (
            <Button onClick={() => handleFollow(user._id,user.status)}>Follow Back</Button>
        )}
        {user.status === 'none' && (
            <Button onClick={() => handleFollow(user._id,user.status)}>Follow</Button>
        )}
        {user.status === 'you-follow' && (
            <span className="text-sm text-gray-500">Following</span>
        )}
        {user.status === 'mutual' && (
            <span className="text-sm text-green-600 font-medium">Friends</span>
        )}
        </div>
    ))
    ) : (
    <p className='text-gray-500'>No users found</p>
    )}

    </div>
                    </div>
                )}

{notificationOpen && (
    <div className='fixed top-0 left-[16%] h-full w-[300px] bg-white shadow-lg transition-transform transform translate-x-0 p-4 overflow-y-auto'>
        <button className='absolute top-2 right-2' onClick={() => setNotificationOpen(false)}>
            <X size={20} />
        </button>
        <h2 className='text-lg font-bold mb-2'>Notifications</h2>
        <div className='space-y-3'>
            {notifications.length > 0 ? (
                notifications.map((notif) => {
                    console.log(notif);
                    
                    const notificationTime = notif.timestamp ? new Date(notif.timestamp) : null;
                    
                    return (
                        <div key={notif._id} className='border-b pb-2'>
                            <p><strong>{notif.fromUserName}</strong> {notif.type}</p>
                            <p className='text-sm text-gray-500'>
                                {notificationTime && !isNaN(notificationTime)
                                    ? formatDistanceToNow(notificationTime, { addSuffix: true })
                                    : "Just now"} 
                            </p>
                        </div>
                    );
                })
            ) : (
                <p className="text-gray-500 text-center">No notifications</p>
            )}
        </div>
    </div>
)}


            </div>
        )
    }

    export default LeftSidebar
