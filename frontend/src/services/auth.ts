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
      url: "/api/v1/auth/email/send-code",
      method: "POST",
      data,
    }),

  verifyCode: (data: VerifyCodeRequest) =>
    request<VerifyCodeResponse>({
      url: "/api/v1/auth/email/verify",
      method: "POST",
      data,
    }),
};
