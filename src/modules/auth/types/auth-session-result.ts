export type AuthSessionResult = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: string; email: string };
  refreshTokenRaw: string;
};
