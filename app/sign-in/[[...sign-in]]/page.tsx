import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen w-full bg-slate-50 items-center justify-center">
      <SignIn />
    </main>
  );
}
