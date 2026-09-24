import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { AuthUser } from "../types";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nombres: user.nombres,
      apellidos: user.apellidos,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN as any) || "7d" },
  );
};

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any = null,
  message: string = "OK",
) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};
