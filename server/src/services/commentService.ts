import { Response } from "express";
import { createCommentRepo, deleteCommentRepo, findReplyCount, listAllCommentsRepo, listSingleCommentRepo, updateCommentRepo } from "../repositories/commentRepo";

export const createCommentService=async(res:Response,comment_id:number,user_id:number,post_id:number,is_reply:boolean,reply_count:number,vote_count:number,text:string)=>{
        if(!comment_id || !user_id || !post_id || is_reply==undefined || reply_count==undefined || vote_count==undefined || !text){
            res.json({
                status:400,
                message:"Send All The Payloads",
            })
        }

        if(is_reply){
            const replyCount:number=await findReplyCount(comment_id);
            if(replyCount>=3){
                res.json({
                    status:400,
                    message:"can not reply till to more than 3 levels deep",
                })
            }

            await createCommentRepo(comment_id,user_id,post_id,true,replyCount+1,0,text);
        }else{
            await createCommentRepo(comment_id,user_id,post_id,false,0,0,text);
        }
}


export const listAllCommentsService=async():Promise<any>=>{
        const comments=await listAllCommentsRepo();
        return comments;
}

export const listSingleCommentService=async(user_id:number):Promise<any>=>{
        const comment=await listSingleCommentRepo(user_id);
        return comment;

}


export const updateCommentService=async(res:Response,vote_count:number,comment_id:number):Promise<any>=>{

        if(!vote_count){
            res.json({
                status:400,
                message:"Vote count is missing",
            })
        }
        await updateCommentRepo(vote_count,comment_id);
}


export const deleteCommentService=async(res:Response,comment_id:number)=>{
    try {
        if(!comment_id){
            res.json({
                status:400,
                message:"Comment_id not provided"
            })
        }

        await deleteCommentRepo(comment_id);
    } catch (error) {
        
    }
}