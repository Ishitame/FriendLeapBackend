import axios from 'axios';

const PostInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1/post/',
  withCredentials: true, // Enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default PostInstance;
