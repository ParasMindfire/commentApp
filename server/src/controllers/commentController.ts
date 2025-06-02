import { NextFunction, Request , Response } from "express";
import { createCommentService, deleteCommentService, listAllCommentsService, listSingleCommentService, updateCommentService } from "../services/commentService";


export const createComment=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {comment_id,user_id,post_id,is_reply,reply_count,vote_count,text}=req.body;
        await createCommentService(res,comment_id,user_id,post_id,is_reply,reply_count,vote_count,text);
        res.json({
            status:201,
            message:`Comment added to post no. ${post_id}`
        })
    } catch (error) {
        next(error);
    }
}


export const listAllComments=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const comments=await listAllCommentsService();
        res.json({
            status:200,
            message:"listed all the comments",
            comments:comments
        })
    } catch (error) {
        next(error);
    }
}

export const listSingleComment=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {user_id}=req.params;
        const comment=await listSingleCommentService(Number(user_id));
        res.json({
            status:200,
            message:"listed all the comments",
            comments:comment
        })
    } catch (error) {
        next(error);
    }
}

export const updateCommentController=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {vote_count,comment_id}=req.body;
        await updateCommentService(res,vote_count,comment_id);
        res.json({
            status:200,
            message:"Updated count of comment",
        })
    } catch (error) {
        next(error);
    }
}


export const deleteCommentController=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {comment_id}=req.body;
        await deleteCommentService(res,comment_id);
        res.json({
            status:200,
            message:"Delete Comment successfully"
        })
    } catch (error) {
        next(error);
    }
}