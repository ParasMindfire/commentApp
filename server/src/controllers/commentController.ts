import { NextFunction, Request, Response } from "express";
import {
    createCommentService,
    deleteCommentService,
    listAllCommentsService,
    listSingleCommentService,
    updateCommentVoteService
} from "../services/commentService";

export const createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { user_id, post_id, parent_id, text } = req.body;
        
        const result = await createCommentService(
            Number(user_id),
            Number(post_id),
            parent_id ? Number(parent_id) : null,
            text
        );

        if (result.success) {
            res.status(201).json({
                status: 201,
                message: result.message,
                comment: result.comment
            });
        } else {
            res.status(400).json({
                status: 400,
                message: result.message
            });
        }
    } catch (error) {
        next(error);
    }
};

export const listAllComments = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { post_id } = req.query;
        const comments = await listAllCommentsService(
            post_id ? Number(post_id) : undefined
        );
        
        res.json({
            status: 200,
            message: "Comments retrieved successfully",
            comments: comments
        });
    } catch (error) {
        next(error);
    }
};

export const listSingleComment = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { comment_id } = req.params;
        const comment = await listSingleCommentService(Number(comment_id));
        
        res.json({
            status: 200,
            message: "Comment retrieved successfully",
            comment: comment
        });
    } catch (error) {
        next(error);
    }
};

export const updateCommentVote = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { comment_id, vote_count } = req.body;
        
        const result = await updateCommentVoteService(
            Number(comment_id),
            Number(vote_count)
        );

        if (result.success) {
            res.json({
                status: 200,
                message: result.message
            });
        } else {
            res.status(400).json({
                status: 400,
                message: result.message
            });
        }
    } catch (error) {
        next(error);
    }
};

export const deleteCommentController = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { comment_id } = req.params;
        
        const result = await deleteCommentService(Number(comment_id));

        if (result.success) {
            res.json({
                status: 200,
                message: result.message
            });
        } else {
            res.status(400).json({
                status: 400,
                message: result.message
            });
        }
    } catch (error) {
        next(error);
    }
};