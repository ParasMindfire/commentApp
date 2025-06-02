import React, { useEffect, Suspense } from 'react';
import { useCommentStore } from '../store/commentStore';
import CommentForm from '../components/CommentForm';
const CommentList = React.lazy(() => import('../components/CommentList'));


const POST_ID = 1; // Hardcoded post ID for this example

const CommentPage: React.FC = () => {
  const { comments, loadComments, loading, error } = useCommentStore();

  useEffect(() => {
    loadComments(POST_ID);

    // Basic polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(() => {
      console.log("Polling for new comments...");
      loadComments(POST_ID);
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [loadComments]);

  return (
    <div className="comment-page-container">
      <h1>Dynamic Comment Thread</h1>
      
      <div className="new-comment-form-container">
        <h2>Leave a Comment</h2>
        <CommentForm parentId={null} postId={POST_ID} />
      </div>

      <hr />

      <div className="comments-section">
        <h2>Comments</h2>
        {loading && comments.length === 0 && <p>Loading comments...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && (
          <Suspense fallback={<div>Loading comment list...</div>}>
            <CommentList comments={comments} postId={POST_ID} />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default CommentPage;