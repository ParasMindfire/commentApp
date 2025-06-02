import { Comment } from "../models/commentModel";
import { sequelize } from "../config/db";
import { QueryTypes } from "sequelize";

export const createCommentRepo = async (
    user_id: number,
    post_id: number,
    parent_id: number | null,
    text: string
): Promise<Comment> => {
    const comment = await Comment.create({
        user_id,
        post_id,
        parent_id,
        text,
        vote_count: 0,
        comment_id: 0
    });
    return comment;
};

export const listAllCommentsRepo = async (post_id?: number): Promise<Comment[]> => {
    const whereClause = post_id ? { post_id } : {};
    
    const comments = await Comment.findAll({
        where: whereClause,
        order: [['created_at', 'ASC']],
        raw: true
    });
    
    return comments;
};

export const listSingleCommentRepo = async (comment_id: number): Promise<Comment | null> => {
    const comment = await Comment.findByPk(comment_id, { raw: true });
    return comment;
};

export const updateCommentVoteRepo = async (
    comment_id: number,
    vote_count: number
): Promise<void> => {
    await Comment.update(
        { vote_count },
        { where: { comment_id } }
    );
};

export const deleteCommentRepo = async (comment_id: number): Promise<void> => {
    // Delete all replies to this comment first
    await Comment.destroy({
        where: { parent_id: comment_id }
    });
    
    // Then delete the comment itself
    await Comment.destroy({
        where: { comment_id }
    });
};

export const getCommentDepth = async (comment_id: number): Promise<number> => {
    const query = `
        WITH RECURSIVE comment_path AS (
            SELECT comment_id, parent_id, 0 as depth
            FROM comments 
            WHERE comment_id = ?
            
            UNION ALL
            
            SELECT c.comment_id, c.parent_id, cp.depth + 1
            FROM comments c
            INNER JOIN comment_path cp ON c.comment_id = cp.parent_id
        )
        SELECT MAX(depth) as max_depth FROM comment_path;
    `;
    
    const result = await sequelize.query(query, {
        replacements: [comment_id],
        type: QueryTypes.SELECT
    }) as any[];
    
    return result[0]?.max_depth || 0;
};
