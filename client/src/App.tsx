import { useEffect, useState } from 'react'
import './App.css'
import {listAllComments} from "./services/index"

function App() {
  const [comments, setComments] = useState([]);


  useEffect(()=>{
    fetchComments();
    // setComments[commentz]
  },[])

  const fetchComments=async()=>{
    const result=await listAllComments();
    console.log("comments ",result.comments);
    setComments(result.body);
    return result;
  }

  return (
    <>
      <h1>Hellooo</h1>
      {comments.map((comment)=>{
        return {}
      })}
    </>
  )
}

export default App
