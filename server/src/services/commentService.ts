import { Response } from "express";
import {
    createCommentRepo,
    deleteCommentRepo,
    listAllCommentsRepo,
    listSingleCommentRepo,
    updateCommentVoteRepo,
    getCommentDepth
} from "../repositories/commentRepo";

const MAX_REPLY_DEPTH = 3;

export const createCommentService = async (
    user_id: number,
    post_id: number,
    parent_id: number | null,
    text: string
): Promise<{ success: boolean; message: string; comment?: any }> => {
    
    if (!user_id || !post_id || !text?.trim()) {
        return {
            success: false,
            message: "Missing required fields: user_id, post_id, and text"
        };
    }

    // Check reply depth if this is a reply
    if (parent_id) {
        const depth = await getCommentDepth(parent_id);
        if (depth >= MAX_REPLY_DEPTH) {
            return {
                success: false,
                message: `Cannot reply more than ${MAX_REPLY_DEPTH} levels deep`
            };
        }
    }

    try {
        const comment = await createCommentRepo(user_id, post_id, parent_id, text.trim());
        return {
            success: true,
            message: "Comment created successfully",
            comment
        };
    } catch (error) {
        console.error("Error creating comment:", error);
        return {
            success: false,
            message: "Failed to create comment"
        };
    }
};

export const listAllCommentsService = async (post_id?: number): Promise<any[]> => {
    const comments = await listAllCommentsRepo(post_id);
    return buildCommentTree(comments);
};

export const listSingleCommentService = async (comment_id: number): Promise<any> => {
    const comment = await listSingleCommentRepo(comment_id);
    return comment;
};

export const updateCommentVoteService = async (
    comment_id: number,
    vote_count: number
): Promise<{ success: boolean; message: string }> => {
    
    if (typeof vote_count !== 'number') {
        return {
            success: false,
            message: "Vote count must be a number"
        };
    }

    try {
        await updateCommentVoteRepo(comment_id, vote_count);
        return {
            success: true,
            message: "Vote updated successfully"
        };
    } catch (error) {
        console.error("Error updating vote:", error);
        return {
            success: false,
            message: "Failed to update vote"
        };
    }
};

export const deleteCommentService = async (comment_id: number): Promise<{ success: boolean; message: string }> => {
    if (!comment_id) {
        return {
            success: false,
            message: "Comment ID is required"
        };
    }

    try {
        await deleteCommentRepo(comment_id);
        return {
            success: true,
            message: "Comment deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return {
            success: false,
            message: "Failed to delete comment"
        };
    }
};

// Helper function to build comment tree structure
const buildCommentTree = (comments: any[]): any[] => {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
        commentMap.set(comment.comment_id, {
            ...comment,
            replies: []
        });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.comment_id);
        
        if (comment.parent_id === null) {
            rootComments.push(commentWithReplies);
        } else {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies.push(commentWithReplies);
            }
        }
    });

    return rootComments;
};