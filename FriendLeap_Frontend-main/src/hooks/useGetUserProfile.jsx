import { setUserProfile } from "@/redux/authSlice";
import AxiosInstance from "@/utils/AxiosInstance";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";


const useGetUserProfile = (userId) => {
    const dispatch = useDispatch();
    // const [userProfile, setUserProfile] = useState(null);
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await AxiosInstance.get(`/${userId}/profile`);
                console.log(res.data,"user profile data");
                
                if (res.data.success) { 
                    dispatch(setUserProfile(res.data));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchUserProfile();
    }, [userId]);
};
export default useGetUserProfile;