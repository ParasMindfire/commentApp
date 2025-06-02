const BASE_URL = 'http://localhost:5000';

export const createComment = async (comment_id:number,user_id:number,post_id:number,is_reply:boolean,reply_count:number,vote_count:number,text:string) => {
  const res = await fetch(`${BASE_URL}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({comment_id,user_id,post_id,is_reply,reply_count,vote_count,text}),
  });
  return res.json();
};

export const listAllComments = async () => {
  const res = await fetch(`${BASE_URL}/comment`);
  console.log("response ",res);
  return res.json();
};

export const updateCommentController = async (vote_count:number,comment_id:number) => {
  await fetch(`${BASE_URL}/comments/id`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({vote_count,comment_id}),
  });
};

export const deleteComments = async (id: number) => {
  await fetch(`BASE_URL/comment/id`, { method: 'DELETE' });
};