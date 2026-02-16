import { Resend } from "resend";

let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// For backwards compatibility, export as resend
export const resend = new Proxy({} as Resend, {
  get: (target, prop) => {
    const instance = getResend();
    return (instance as any)[prop];
  }
});

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "Trita <noreply@trita.hu>";
