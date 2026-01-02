import jwt, { type JwtPayload } from "jsonwebtoken"

export interface TokenPayload{
    userId:string;
}

const JWT_SECRET:string = process.env.JWT_SECRET as string;

if(!JWT_SECRET){
    throw new Error("JWT_SECRET is not defined");
}

export function signAccessToken(payload:TokenPayload):string{
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn:"1d",
    })
}


export function verifyAccessToken(token:string):TokenPayload{
    const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload;

    if(!decoded || typeof decoded != "object" || !decoded.userId){
        throw new Error("Invalid token payload");
    }

    return {
        userId:decoded.userId,
    }
}