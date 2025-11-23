import { UserDocument } from "../models/user.model";
import { Socket } from "socket.io";

declare global {
  namespace Express {
    interface User extends UserDocument {
      _id?: any;
    }
  }
}

export interface ExtendedSocket extends Socket {
  userId?: string;
  user?: Express.User;
}
