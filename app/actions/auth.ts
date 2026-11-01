"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface UserSession {
  email: string;
  name: string;
  role: string;
  avatarLetter: string;
  loggedInAt: string;
}

const KNOWN_STAFF: Record<string, { name: string; role: string; avatarLetter: string }> = {
  "founder@royalknot.in": {
    name: "Maharani Gayatri Devi (Hon.)",
    role: "Founder & Principal Planner",
    avatarLetter: "G",
  },
  "concierge@royalknot.in": {
    name: "Raghvendra Singh Rathore",
    role: "Senior Wedding Concierge",
    avatarLetter: "R",
  },
  "logistics@royalknot.in": {
    name: "Vikramaditya Shekhawat",
    role: "Finance & Logistics Director",
    avatarLetter: "V",
  },
};

const MASTER_PASSWORD = "RoyalKnot@2026";

export async function loginAction(formData: {
  email: string;
  password?: string;
  rememberMe?: boolean;
}): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password?.trim();

  if (!email) {
    return { success: false, error: "Please enter your registered staff email or ID." };
  }

  // Accept master password or pre-filled password
  const isValidPass =
    password === MASTER_PASSWORD ||
    password === "••••••••••••" ||
    password === "admin" ||
    password === "royal2026";

  if (!isValidPass) {
    return {
      success: false,
      error: "Invalid access key. Use 'RoyalKnot@2026' or 1-click select a manager profile below.",
    };
  }

  const staff = KNOWN_STAFF[email] || {
    name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    role: "Palace Event Coordinator",
    avatarLetter: email[0].toUpperCase(),
  };

  const userSession: UserSession = {
    email,
    name: staff.name,
    role: staff.role,
    avatarLetter: staff.avatarLetter,
    loggedInAt: new Date().toISOString(),
  };

  const cookieStore = cookies();
  const maxAge = formData.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  cookieStore.set("royal_knot_session", JSON.stringify(userSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return { success: true, user: userSession };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete("royal_knot_session");
  redirect("/login");
}

export async function getSessionAction(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("royal_knot_session");
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch {
    return null;
  }
}
