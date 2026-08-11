
import { 
    Request,
    Response,
    NextFunction
} from "express";

import { ForbiddenError } from "../utils/app-error";

const platformAdminMiddleware = (
    req:Request,
    res:Response,
    next:NextFunction
):void =>{
    if(!req.user){
        next(
            new ForbiddenError(
                'Authentication required'
            )
        )
        return
    }

    if(!req.user.isPlatformAdmin){
        next(
            new ForbiddenError(
                'Platform Administrator access required'
            )
        );
        return 
    }
 next()
}

export default platformAdminMiddleware