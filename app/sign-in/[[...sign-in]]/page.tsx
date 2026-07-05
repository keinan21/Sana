import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center">
      <SignIn />
    </div>
  );
}
