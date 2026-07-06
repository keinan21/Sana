import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen w-full bg-slate-50 items-center justify-center">
      <SignUp />
    </main>
  );
}
