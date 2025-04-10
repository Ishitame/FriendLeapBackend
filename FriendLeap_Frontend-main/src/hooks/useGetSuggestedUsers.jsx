import { setSuggestedUsers } from "@/redux/authSlice";
import AxiosInstance from "@/utils/AxiosInstance";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";


const useGetSuggestedUsers = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                const res = await AxiosInstance.get('/suggested');      
                if (res.data) {            
                    dispatch(setSuggestedUsers(res.data));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchSuggestedUsers();
    }, []);
};
export default useGetSuggestedUsers;