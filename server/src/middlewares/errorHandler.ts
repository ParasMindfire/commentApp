import { NextFunction , Request, Response} from "express";

export const errorHandler=(err:any,req:Request,res:Response,next:NextFunction)=>{
    try {
        const erroMessage=err.message || 'Internal Server Error'
        const errStatus=err.status || 500

        res.json({
            message:erroMessage,
            status:errStatus
        })

    } catch (error) {
        
    }
}