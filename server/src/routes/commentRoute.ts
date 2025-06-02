import { Router } from "express";
import {createComment, deleteCommentController, listAllComments, listSingleComment, updateCommentController} from "../controllers/commentController"

const commentRouter = Router();

commentRouter.post('/comment',createComment);
commentRouter.get('/comment',listAllComments);
commentRouter.patch('/comment',updateCommentController)
commentRouter.delete('/comment',deleteCommentController)
commentRouter.get('/comments/:user_id',listSingleComment);

export default commentRouter;



