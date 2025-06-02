import { sequelize } from "../config/db"

export const findReplyCount=async(comment_id:number):Promise<any>=>{
    const count=await sequelize.query('select reply_count from comments where comment_id=?',{
        replacements:[comment_id],
    })

    return count;
}

export const createCommentRepo=async(comment_id:number,user_id:number,post_id:number,is_reply:boolean,reply_count:number,vote_count:number,text:string)=>{
    await sequelize.query('insert into comments (comment_id,user_id,post_id,is_reply,reply_count,vote_count,text) values (?,?,?,?,?,?,?)',{
        replacements:[comment_id,user_id,post_id,is_reply,reply_count,vote_count,text]
    })
}

export const listAllCommentsRepo=async():Promise<any>=>{
    const comments=sequelize.query('select * from comments');
    return comments;
}


export const listSingleCommentRepo=async(user_id:number):Promise<any>=>{
    const comment=sequelize.query('select * from comments where user_id = ?',{
        replacements:[user_id]
    })

    return comment;
}


export const updateCommentRepo=async(vote_count:number,comment_id:number):Promise<any>=>{
    await sequelize.query("update comments set vote_count= ? where comment_id=? ",{
        replacements:[vote_count,comment_id]
    })
}

export const deleteCommentRepo=async(comment_id:number)=>{
    await sequelize.query('delete from comments where comment_id=?',{replacements:[comment_id]});
}