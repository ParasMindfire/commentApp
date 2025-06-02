import { create } from 'zustand';
import type { IComment, ICommentFE, CreateCommentPayload, BackendCreateCommentPayload } from '../interfaces/comment';
import { fetchComments, addComment, updateCommentVote, deleteCommentApi } from '../services/commentApiService';

interface CommentStoreState {
  comments: ICommentFE[];
  loading: boolean;
  error: string | null;
  activeReplyToId: number | null; // ID of the comment being replied to

  loadComments: (postId: number) => Promise<void>;
  postComment: (payload: CreateCommentPayload, currentComments: ICommentFE[]) => Promise<void>;
  voteComment: (commentId: number, voteType: 'up' | 'down') => Promise<void>;
  removeComment: (commentId: number) => Promise<void>;
  setActiveReplyToId: (commentId: number | null) => void;
  getCommentById: (commentId: number) => ICommentFE | undefined;
}

// Helper function to build the thread
const buildThread = (comments: IComment[], parentId: number | null = null, currentDepth = 0): ICommentFE[] => {
  return comments
    .filter(comment => comment.parent_id === parentId)
    .map(comment => ({
      ...comment,
      authorName: `User ${comment.user_id}`, // Mock author name
      is_deleted: comment.is_deleted || false,
      createdAt: comment.createdAt || new Date().toISOString(), // Fallback
      children: buildThread(comments, comment.comment_id, currentDepth + 1),
      // Ensure reply_count from backend is used, or derive if necessary
      reply_count: comment.reply_count !== undefined ? comment.reply_count : currentDepth,
    }));
};

// Helper to find a comment and its parent in the tree structure
const findCommentAndParent = (
    comments: ICommentFE[],
    commentId: number,
    parent: ICommentFE | null = null
): { comment: ICommentFE | null; parent: ICommentFE | null } => {
    for (const c of comments) {
        if (c.comment_id === commentId) {
            return { comment: c, parent };
        }
        const foundInChildren = findCommentAndParent(c.children, commentId, c);
        if (foundInChildren.comment) {
            return foundInChildren;
        }
    }
    return { comment: null, parent: null };
};

// Helper to update a comment in the tree (immutable)
const updateCommentInTree = (
    comments: ICommentFE[],
    updatedComment: Partial<ICommentFE> & { comment_id: number }
): ICommentFE[] => {
    return comments.map(comment => {
        if (comment.comment_id === updatedComment.comment_id) {
            return { ...comment, ...updatedComment };
        }
        if (comment.children && comment.children.length > 0) {
            return { ...comment, children: updateCommentInTree(comment.children, updatedComment) };
        }
        return comment;
    });
};


export const useCommentStore = create<CommentStoreState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,
  activeReplyToId: null,

  loadComments: async (postId: number) => {
    set({ loading: true, error: null });
    try {
      const rawComments = await fetchComments(postId);
      const threadedComments = buildThread(rawComments);
      set({ comments: threadedComments, loading: false });
    } catch (err) {
      set({ error: 'Failed to load comments.', loading: false });
      console.error(err);
    }
  },

    postComment: async (payload: CreateCommentPayload, currentComments: ICommentFE[]) => {
    set({ loading: true, error: null });
    const { parent_comment_id, user_id, post_id, text } = payload;
    
    let parentComment: ICommentFE | undefined | null = null;
    let newReplyCount = 0; // This is the depth of the new comment

    if (parent_comment_id) {
        const findResult = findCommentAndParent(currentComments, parent_comment_id);
        parentComment = findResult.comment;
        if (parentComment) {
            // Explicitly convert parentComment.reply_count to a number before adding
            const parentDepth = Number(parentComment.reply_count);
            if (isNaN(parentDepth)) {
                console.error(
                    `Error: parentComment.reply_count ('${parentComment.reply_count}') is not a valid number for comment ID ${parentComment.comment_id}. Defaulting depth calculation.`
                );
                // Fallback: if parent depth is invalid, treat new reply as if parent was depth 0.
                // Or, you might want to throw an error or prevent the reply.
                newReplyCount = 1; // Assumes parent was depth 0 + 1
            } else {
                newReplyCount = parentDepth + 1;
            }
        } else {
            // Parent comment not found in current client state, should ideally not happen if UI is consistent
            console.error(`Error: Parent comment with ID ${parent_comment_id} not found in client state.`);
            // Fallback or throw error. For now, let's assume it implies a top-level comment if parent is not found (incorrect logic but a fallback).
            // A better approach would be to prevent the reply or show an error.
            // For now, setting reply_count as if it's a top-level (depth 0) reply (which is inconsistent).
            // This branch ideally shouldn't be hit if parent_comment_id is valid and UI is synced.
            // If parent_comment_id is valid but not found, it implies a data inconsistency or a bug.
            // Perhaps default to an error state.
            set({ error: `Parent comment ${parent_comment_id} not found for reply.`, loading: false });
            return;
        }
    } // else, it's a top-level comment, newReplyCount remains 0 (depth 0)

    if (parent_comment_id && newReplyCount > 3) {
        set({ error: "Cannot reply more than 3 levels deep.", loading: false });
        return;
    }

    const newCommentId = Math.floor(Math.random() * 1000000) + 1;

    const backendPayload: BackendCreateCommentPayload = {
        comment_id: newCommentId,
        user_id,
        post_id,
        text,
        is_reply: !!parent_comment_id,
        reply_count: newReplyCount, // This should now be a clean integer
        vote_count: 0,
        // parent_comment_id: parent_comment_id || undefined, // Send actual parent_id
    };

    // Optimistic update object
    const newCommentFE: ICommentFE = {
      comment_id: newCommentId,
      user_id,
      post_id,
      text,
      is_reply: !!parent_comment_id,
      reply_count: newReplyCount, // Use the calculated, clean depth
      vote_count: 0,
      parent_id: parent_comment_id,
      authorName: `User ${user_id}`,
      createdAt: new Date().toISOString(),
      children: [],
      is_deleted: false,
    };

    // Add to children of parent (optimistic update)
    let updatedComments;
    if (parent_comment_id && parentComment) { // Ensure parentComment exists for adding as child
      const addReplyToTree = (nodes: ICommentFE[], newReply: ICommentFE): ICommentFE[] => {
          return nodes.map(node => {
              if (node.comment_id === parent_comment_id) {
                  return { ...node, children: [...node.children, newReply] };
              }
              if (node.children && node.children.length > 0) {
                  return { ...node, children: addReplyToTree(node.children, newReply) };
              }
              return node;
          });
      };
      updatedComments = addReplyToTree(get().comments, newCommentFE);
    } else if (!parent_comment_id) { // It's a new top-level comment
      updatedComments = [...get().comments, newCommentFE];
    } else {
      // This case (parent_comment_id exists but parentComment is null/undefined)
      // was handled above by returning early with an error.
      // If it somehow reaches here, it means an issue in logic.
      // To be safe, don't modify comments if state is inconsistent.
      console.error("Inconsistent state for optimistic update of reply.");
      updatedComments = get().comments; // No change
    }
    set({ comments: updatedComments, activeReplyToId: null });

    try {
      await addComment(backendPayload);
      set({loading: false});
    } catch (err: any) {
      set({ error: err.message || 'Failed to post comment.', loading: false });
      // Revert optimistic update (logic for this needs to be robust)
      // For simplicity, could just reload all comments on error:
      // await get().loadComments(post_id);
      console.error(err);
    }
  },


  voteComment: async (commentId: number, voteType: 'up' | 'down') => {
    const { comment } = findCommentAndParent(get().comments, commentId);
    if (!comment) return;

    const currentVoteCount = comment.vote_count;
    const newVoteCount = voteType === 'up' ? currentVoteCount + 1 : currentVoteCount - 1;

    // Optimistic update
    const updatedComments = updateCommentInTree(get().comments, { comment_id: commentId, vote_count: newVoteCount });
    set({ comments: updatedComments });

    try {
      await updateCommentVote({ comment_id: commentId, vote_count: newVoteCount });
      // No need to re-fetch if API call is successful
    } catch (err) {
      // Revert optimistic update
      const revertedComments = updateCommentInTree(get().comments, { comment_id: commentId, vote_count: currentVoteCount });
      set({ comments: revertedComments, error: 'Failed to update vote.' });
      console.error(err);
    }
  },

  removeComment: async (commentId: number) => {
    // Optimistic update: mark as deleted
    const markAsDeleted = (nodes: ICommentFE[]): ICommentFE[] => {
        return nodes.map(node => {
            if (node.comment_id === commentId) {
                return { ...node, text: "[Comment deleted]", is_deleted: true };
            }
            if (node.children && node.children.length > 0) {
                return { ...node, children: markAsDeleted(node.children) };
            }
            return node;
        });
    };
    const originalComments = get().comments;
    set({ comments: markAsDeleted(originalComments) });

    try {
      await deleteCommentApi(commentId);
      // Backend hard deletes. Our optimistic update already reflects what we want to show.
      // If backend only marked as deleted, we would re-fetch or rely on optimistic.
    } catch (err) {
      // Revert optimistic update if API fails
      set({ comments: originalComments, error: 'Failed to delete comment.' });
      console.error(err);
    }
  },

  setActiveReplyToId: (commentId: number | null) => {
    set({ activeReplyToId: commentId });
  },
  
  getCommentById: (commentId: number): ICommentFE | undefined => {
    const find = (nodes: ICommentFE[]): ICommentFE | undefined => {
        for (const node of nodes) {
            if (node.comment_id === commentId) return node;
            const foundInChildren = find(node.children);
            if (foundInChildren) return foundInChildren;
        }
        return undefined;
    };
    return find(get().comments);
  }
}));