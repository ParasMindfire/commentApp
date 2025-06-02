import axios from 'axios';
import type { IComment, BackendCreateCommentPayload, UpdateVotePayload } from '../interfaces/comment';

const API_URL = 'http://localhost:5000'; // Your backend URL

interface ApiResponse<T = any> {
  status: number;
  message: string;
  comments?: T; // For list operations
  comment?: T;  // For single operations
}

// Helper to generate uniqueish IDs for new comments client-side
// In a real app, backend should generate IDs.



export const fetchComments = async (postId: number): Promise<IComment[]> => {
  // Your backend GET /comment doesn't take postId.
  // This is a placeholder. Ideally, it should be /posts/{postId}/comments
  // For now, we fetch all and assume they are for the relevant post.
  try {
    const response = await axios.get<ApiResponse<IComment[]>>(`${API_URL}/comment`);
    // The backend returns { status, message, comments: [results, metadata] }
    // Sequelize query raw results are [results, metadata]
    if (response.data.comments && Array.isArray(response.data.comments[0])) {
        // Assuming the first element of comments array is the actual data
        // And assuming your backend adds parent_id and authorName (or we derive it)
        return response.data.comments[0].map(comment => ({
            ...comment,
            // Ensure parent_id exists, defaulting to null if not provided by backend
            parent_id: comment.parent_id !== undefined ? comment.parent_id : null,
        }));
    }
    console.warn("Fetched comments format unexpected or no comments:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};


export const addComment = async (
    payload: BackendCreateCommentPayload
): Promise<ApiResponse> => {
    // This aligns with your backend `createCommentService` which then calls `createCommentRepo`
    try {
        // The backend createCommentService doesn't return the created comment directly in its primary response
        // It sends a generic success message. We might need to re-fetch or optimistically update.
        const response = await axios.post<ApiResponse>(`${API_URL}/comment`, payload);
        if (response.data.status !== 201) {
            throw new Error(response.data.message || "Failed to add comment");
        }
        return response.data;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const updateCommentVote = async (payload: UpdateVotePayload): Promise<ApiResponse> => {
  try {
    const response = await axios.patch<ApiResponse>(`${API_URL}/comment`, payload);
    if (response.data.status !== 200) {
        throw new Error(response.data.message || "Failed to update vote");
    }
    return response.data;
  } catch (error) {
    console.error("Error updating vote:", error);
    throw error;
  }
};

export const deleteCommentApi = async (comment_id: number): Promise<ApiResponse> => {
  try {
    // Backend expects comment_id in body for DELETE, which is non-standard.
    // Typically it's /comment/:comment_id
    const response = await axios.delete<ApiResponse>(`${API_URL}/comment`, { data: { comment_id } });
    if (response.data.status !== 200) {
        throw new Error(response.data.message || "Failed to delete comment");
    }
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};