import { request } from "./client-request";

export interface SendCodeRequest {
  email: string;
}

export interface SendCodeResponse {
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export const authService = {
  sendCode: (data: SendCodeRequest) =>
    request<SendCodeResponse>({
      baseURL: "http://localhost:8080",
      url: "/api/auth/email/send-code",
      method: "POST",
      data,
    }),

  verifyCode: (data: VerifyCodeRequest) =>
    request<VerifyCodeResponse>({
      baseURL: "http://localhost:8080",
      url: "/api/auth/email/verify",
      method: "POST",
      data,
    }),
};
