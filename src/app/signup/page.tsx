"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import {useRouter} from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import RootLayout from "../layout";

export default function SignupPage() {
    const router = useRouter();
    const [user, setUser] = React.useState({
        email: "",
        password: "",
        username: "",
    })
    const [buttonDisabled, setButtonDisabled] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const onSignup = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/signup", user);
            console.log("Signup success", response.data);
            router.push("/login");
            
        } catch (error:any) {
            console.log("Signup failed", error.message);
            
            toast.error(error.message);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if(user.email.length > 0 && user.password.length > 0 && user.username.length > 0) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [user]);


    return (
      <RootLayout isLoginPage={true}>
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
          <div className="flex flex-col items-center justify-center py-2 w-full max-w-md p-4 border rounded-3xl container">
            <h1 className="text-3xl font-bold mb-4">{loading}Signup</h1>
            <hr className="w-full mb-8" />
            <label htmlFor="username" className="mb-2">
              Username
            </label>
            <input
              className="p-2 text-black border border-green-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 w-80"
              id="username"
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              placeholder="Username"
            />
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
              onClick={onSignup}
              className={`p-1 border w-20 text-black border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 ${
                buttonDisabled ? "bg-sky-50 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={buttonDisabled}
            >
              {loading ? "..." : "Signup"}
            </button>
            <Link href="/login" className="text-green-300 hover:underline hover:text-sky-300 transition">
              Already have an account? Login
            </Link>
          </div>
        </div>
        </RootLayout>
      ); 

}