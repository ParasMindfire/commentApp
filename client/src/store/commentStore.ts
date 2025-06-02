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
    let newReplyCount = 0;

    if (parent_comment_id) {
        const findResult = findCommentAndParent(currentComments, parent_comment_id);
        parentComment = findResult.comment;
        if (parentComment) {
            newReplyCount = parentComment.reply_count + 1;
        }
    }

    if (parent_comment_id && newReplyCount > 3) {
        set({ error: "Cannot reply more than 3 levels deep.", loading: false });
        // alert("Cannot reply more than 3 levels deep.");
        return;
    }

    const newCommentId = Math.floor(Math.random() * 1000000) + 1; // Client-generated ID (ideally from backend)

    const backendPayload: BackendCreateCommentPayload = {
        comment_id: newCommentId, // ID for the new comment
        user_id,
        post_id,
        text,
        is_reply: !!parent_comment_id,
        reply_count: newReplyCount,
        vote_count: 0,
    };

    try {
      // Optimistic update
      const newCommentFE: ICommentFE = {
        ...backendPayload, // this has comment_id, user_id, post_id, text, is_reply, reply_count, vote_count
        parent_id: parent_comment_id,
        authorName: `User ${user_id}`, // Mock
        createdAt: new Date().toISOString(),
        children: [],
        is_deleted: false,
      };

      let updatedComments;
      if (parent_comment_id && parentComment) {
        // Add to children of parent
        const addReplyToTree = (nodes: ICommentFE[]): ICommentFE[] => {
            return nodes.map(node => {
                if (node.comment_id === parent_comment_id) {
                    return { ...node, children: [...node.children, newCommentFE] };
                }
                if (node.children && node.children.length > 0) {
                    return { ...node, children: addReplyToTree(node.children) };
                }
                return node;
            });
        };
        updatedComments = addReplyToTree(get().comments);
      } else {
        // Add as top-level comment
        updatedComments = [...get().comments, newCommentFE];
      }
      set({ comments: updatedComments, activeReplyToId: null }); // Clear reply form

      await addComment(backendPayload);
      // Backend doesn't return the created comment with its final ID (if DB generated).
      // For a robust solution, the backend should return the created entity.
      // Then we would update the optimistic comment with the real ID.
      // For now, we might need to reload all comments to get DB-generated IDs and timestamps.
      // Or, trust the client-generated ID if the backend uses the one provided.
      // await get().loadComments(post_id); // Re-fetch to get actual data (optional, but safer)
      set({loading: false});

    } catch (err: any) {
      set({ error: err.message || 'Failed to post comment.', loading: false });
      // Revert optimistic update if needed, or simply show error
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