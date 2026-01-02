import type { Response,Request,NextFunction } from "express";
import { verifyAccessToken } from "./jwt.js";


export interface AuthenticatedRequest extends Request{
    user?:{
        userId:string;
    }
}

export function authMiddleware(req:AuthenticatedRequest, res:Response, next:NextFunction){
    try{

        const token = req.cookies?.access_token;

        if(!token){
            return res.status(401).json({
                error:"Authntication required",
            })
        }

        const payload = verifyAccessToken(token);

        req.user = {
            userId:payload.userId,
        }

        next();

    }catch(error){

        return res.status(401).json({
      error: "Invalid or expired token",
    });

    }
}