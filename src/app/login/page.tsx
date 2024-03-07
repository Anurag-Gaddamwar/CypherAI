'use client'
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import RootLayout from "../layout";

interface User {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>({
    email: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", user);
      console.log("Login success", response.data);
      toast.success("Login success");
      router.push("/");
    } catch (error: any) {
      console.log("Login failed", error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);

  return (
    <RootLayout isLoginPage={true}>
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex flex-col items-center justify-center py-2 w-full max-w-md p-4 border rounded-3xl container">
        <h1 className="text-3xl font-bold mb-4">{loading} Login</h1>
        <hr className="w-full mb-8" />
       
        <label htmlFor="email" className="mb-2">
          Email
        </label>
        <input
          className="p-2 text-black border border-green-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 w-80"
          id="email"
          type="text"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email"
        />
        <label htmlFor="password" className="mb-2">
          Password
        </label>
        <input
          className="p-2 text-black border border-green-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 w-80"
          id="password"
          type="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="Password"
        />
        <button
          onClick={onLogin}
          className={`p-1 border w-20 text-black border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 ${
            buttonDisabled ? "bg-sky-50 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          disabled={buttonDisabled}
        >
          {loading ? "..." : "Login"}
        </button>
        <Link href="/signup" className="text-green-300 hover:underline hover:text-sky-300 transition">
          New User? Sign Up
        </Link>
      </div>
    </div>
    </RootLayout>
  );


}
