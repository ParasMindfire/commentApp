import React, { useState } from 'react';
import { useCommentStore } from '../store/commentStore';
import type { CreateCommentPayload } from '../interfaces/comment';
interface CommentFormProps {
  parentId: number | null; // ID of the comment being replied to, null for new top-level comment
  postId: number; // The post this comment belongs to
  onCommentPosted?: () => void; // Callback after successful post
}

const CommentForm: React.FC<CommentFormProps> = ({ parentId, postId, onCommentPosted }) => {
  const [text, setText] = useState('');
  const postComment = useCommentStore(state => state.postComment);
  const comments = useCommentStore(state => state.comments); // Get current comments for context
  const isLoading = useCommentStore(state => state.loading);
  const error = useCommentStore(state => state.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const payload: CreateCommentPayload = {
      parent_comment_id: parentId,
      user_id: Math.floor(Math.random() * 100) + 1, // Mock user ID
      post_id: postId,
      text: text.trim(),
    };

    await postComment(payload, comments); // Pass current comments for context
    setText('');
    if (onCommentPosted) {
      onCommentPosted();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !text.trim()}>
        {isLoading ? 'Submitting...' : (parentId ? 'Reply' : 'Post Comment')}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default CommentForm;