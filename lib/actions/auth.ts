"use server";

import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { hash } from "bcryptjs";
import { signIn } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { workflowClient } from "@/lib/workflow";
import config from "@/lib/config";
import ratelimit from "../ratelimit";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">
) => {
  const { email, password } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign-in error:", error);
    return { success: false, error: "Signin error" };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, universityId, password } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "User already exists" };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      password: hashedPassword,
    });

    // // Ensure correct API endpoint format
    // const apiEndpoint = config.env.prodApiEndpoint.startsWith("http")
    //   ? config.env.prodApiEndpoint
    //   : `https://${config.env.prodApiEndpoint}`;

    // // Debugging: log workflow request
    // console.log("Triggering workflow for:", email, fullName);

    // try {
    //   const workflowResponse = await workflowClient.trigger({
    //     url: `${apiEndpoint}/api/workflows/onboarding`,
    //     body: { email, fullName },
    //   });
    //   console.log("Workflow triggered successfully:", workflowResponse);
    // } catch (workflowError) {
    //   console.error("Failed to trigger workflow:", workflowError);
    //   return { success: false, error: "Failed to trigger workflow" };
    // }

    // Attempt to sign in after sign-up
    const signInResult = await signInWithCredentials({ email, password });
    if (!signInResult.success) {
      return { success: false, error: "Sign-in failed after sign-up" };
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Signup error" };
  }
};
