import { Router } from "express";
import {
    createComment,
    deleteCommentController,
    listAllComments,
    listSingleComment,
    updateCommentVote
} from "../controllers/commentController";

const commentRouter = Router();

commentRouter.post('/comment', createComment);
commentRouter.get('/comment', listAllComments); // ?post_id=123 for specific post
commentRouter.get('/comment/:comment_id', listSingleComment);
commentRouter.patch('/comment', updateCommentVote);
commentRouter.delete('/comment/:comment_id', deleteCommentController);

export default commentRouter;
