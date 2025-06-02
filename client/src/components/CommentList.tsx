 import React from 'react';
import type { ICommentFE } from '../interfaces/comment';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: ICommentFE[];
  postId: number;
  currentDepth?: number; // To track nesting level, starts at 0 for top-level
}

const CommentList: React.FC<CommentListProps> = ({ comments, postId, currentDepth = 0 }) => {
  if (!comments || comments.length === 0) {
    return currentDepth === 0 ? <p>No comments yet. Be the first to comment!</p> : null;
  }

  return (
    <div className={`comment-list depth-${currentDepth}`}>
      {comments.map(comment => (
        <CommentItem 
            key={comment.comment_id} 
            comment={comment} 
            postId={postId} 
            currentDepth={currentDepth}
        />
      ))}
    </div>
  );
};

export default CommentList;