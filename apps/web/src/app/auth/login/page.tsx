import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign In | ContentFlow",
  description: "Sign in to your ContentFlow account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
