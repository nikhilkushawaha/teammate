import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Express, Request, Response, NextFunction } from "express";
import session from "cookie-session";
import passport from "passport";
import { config } from "./app.config";
import { ExtendedSocket } from "../@types/index.d";
import { UnauthorizedException } from "../utils/appError";

// Helper to wrap Express middleware for Socket.io
const wrap = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (socket: ExtendedSocket, next: (err?: Error) => void) => {
    middleware(socket.request as Request, {} as Response, next as NextFunction);
  };
};

export const initializeSocketIO = (
  httpServer: HTTPServer,
  app: Express
): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.FRONTEND_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Create session middleware (same config as Express app)
  const isProd = config.NODE_ENV === "production";
  const sessionMiddleware = session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
  });

  // Apply session middleware to Socket.io
  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  // Authentication check
  io.use((socket: ExtendedSocket, next) => {
    const req = socket.request as any;
    if (req.user && req.user._id) {
      socket.userId = req.user._id.toString();
      socket.user = req.user;
      next();
    } else {
      // Create a proper Error object that Socket.io can handle
      const error = new Error("Unauthorized: Please log in");
      (error as any).data = { message: "Unauthorized", code: "UNAUTHORIZED" };
      next(error);
    }
  });

  return io;
};

