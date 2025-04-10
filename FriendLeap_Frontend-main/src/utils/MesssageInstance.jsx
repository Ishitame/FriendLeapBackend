import axios from 'axios';

const MessageInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1/message',
  withCredentials: true, // Enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default MessageInstance;
