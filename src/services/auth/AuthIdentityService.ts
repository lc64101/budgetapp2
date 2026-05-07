import type { SupabaseClient } from "@supabase/supabase-js";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes("@");
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return "Username is required";
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username must be 3-24 characters and use only letters, numbers, or underscores";
  }

  return null;
}

export class AuthIdentityService {
  constructor(private readonly supabase: SupabaseClient) {}

  async assertUsernameAvailable(username: string, currentUserId?: string): Promise<string> {
    const validationError = validateUsername(username);
    if (validationError) {
      throw new Error(validationError);
    }

    const normalized = normalizeUsername(username);
    const { data, error } = await this.supabase.from("profiles").select("id").eq("username", normalized).maybeSingle();

    if (error) {
      throw new Error(`Failed to check username availability: ${error.message}`);
    }

    if (data?.id && data.id !== currentUserId) {
      throw new Error("Username is already taken");
    }

    return normalized;
  }

  async resolveEmailForLogin(identifier: string): Promise<string> {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      throw new Error("Enter your username");
    }

    if (isEmailIdentifier(normalizedIdentifier)) {
      return normalizedIdentifier.toLowerCase();
    }

    const validationError = validateUsername(normalizedIdentifier);
    if (validationError) {
      throw new Error("Invalid email, username, or password");
    }

    const username = normalizeUsername(normalizedIdentifier);
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Failed to resolve login identifier: ${profileError.message}`);
    }

    if (!profile?.id) {
      throw new Error("Invalid email, username, or password");
    }

    const {
      data: { user },
      error: userError,
    } = await this.supabase.auth.admin.getUserById(profile.id);

    if (userError || !user?.email) {
      throw new Error("Invalid email, username, or password");
    }

    return user.email.toLowerCase();
  }
}