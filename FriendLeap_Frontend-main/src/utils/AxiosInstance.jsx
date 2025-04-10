import axios from 'axios';

const AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1/user',
  withCredentials: true, // Enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default AxiosInstance;
