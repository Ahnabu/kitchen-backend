import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'fallback_access_secret_kitchen_malta_12345';
const ACCESS_EXPIRE = process.env.JWT_EXPIRES_IN || '15m';

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_kitchen_malta_67890';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRE } as any);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE } as any);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
