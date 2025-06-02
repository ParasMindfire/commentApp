import React from 'react';
import type { ICommentFE } from '../interfaces/comment';
import { useCommentStore } from '../store/commentStore';
import CommentForm from './CommentForm';
// Import CommentList lazily to avoid circular dependency if CommentList imports CommentItem
const CommentList = React.lazy(() => import('./CommentList'));


interface CommentItemProps {
  comment: ICommentFE;
  postId: number;
  currentDepth: number; // Current nesting level
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, currentDepth }) => {
  const { voteComment, removeComment, setActiveReplyToId, activeReplyToId } = useCommentStore();

  const handleReplyClick = () => {
    if (currentDepth < 3) {
      setActiveReplyToId(comment.comment_id === activeReplyToId ? null : comment.comment_id);
    } else {
      alert("Cannot reply to comments more than 3 levels deep.");
    }
  };
  
  const timeAgo = (dateString?: string): string => {
    if (!dateString) return 'just now';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };


  return (
    <div className={`comment-item depth-${currentDepth} ${comment.is_deleted ? 'deleted-comment' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.is_deleted ? '[Author]' : comment.authorName}</span>
        <span className="comment-timestamp">{timeAgo(comment.createdAt)}</span>
      </div>
      <p className="comment-text">{comment.text}</p>
      
      {!comment.is_deleted && (
        <div className="comment-actions">
          <button onClick={() => voteComment(comment.comment_id, 'up')} aria-label="Upvote">👍</button>
          <span>{comment.vote_count}</span>
          <button onClick={() => voteComment(comment.comment_id, 'down')} aria-label="Downvote">👎</button>
          
          {currentDepth < 3 && ( // Only allow reply if not exceeding max depth
            <button onClick={handleReplyClick} className="reply-button">
              {activeReplyToId === comment.comment_id ? 'Cancel Reply' : 'Reply'}
            </button>
          )}
          {/* Mock: Allow delete only by User 1 */}
          {comment.user_id === 1 && <button onClick={() => removeComment(comment.comment_id)} className="delete-button">Delete</button>}
        </div>
      )}

      {activeReplyToId === comment.comment_id && currentDepth < 3 && (
        <div className="reply-form-container">
          <CommentForm
            parentId={comment.comment_id}
            postId={postId}
            onCommentPosted={() => setActiveReplyToId(null)} // Close form on post
          />
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <React.Suspense fallback={<div>Loading replies...</div>}>
          <div className="comment-replies">
            <CommentList comments={comment.children} postId={postId} currentDepth={currentDepth + 1} />
          </div>
        </React.Suspense>
      )}
    </div>
  );
};

export default CommentItem;