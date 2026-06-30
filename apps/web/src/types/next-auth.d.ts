import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      phoneVerifiedAt?: string | null;
      role: string;
      avatar?: string | null;
      accessToken: string;
    };
  }

  interface User {
    id: string;
    role: string;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    avatar?: string | null;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    avatar?: string | null;
    accessToken: string;
  }
}
