import React from 'react'
import Post from './Post'
import { useSelector } from 'react-redux'
import Stories from './Stories'


const Posts = () => {
  const {posts} = useSelector(store=>store.post);
 
  
  

  return (
    <div className='w-[800px] '>
   
       <Stories></Stories>
  
  <div className='w-full' >
        {
            posts.map((post) => <Post key={post._id} post={post}/>)
        }
  </div>

    </div>
  )
  
}

export default Posts