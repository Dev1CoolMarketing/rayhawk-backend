import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: unknown;
};

type SupabaseErrorResponse = {
  error?: string;
  error_description?: string;
  msg?: string;
};

@Injectable()
export class SupabaseWebAuthService {
  constructor(private readonly config: ConfigService) {}

  async signInWithPassword(email: string, password: string): Promise<SupabaseSessionResponse> {
    return this.post<SupabaseSessionResponse>(
      '/auth/v1/token?grant_type=password',
      {
        email,
        password,
      },
      undefined,
      { unauthorizedOn400: true },
    );
  }

  async signUp(email: string, password: string, redirectTo?: string | null): Promise<SupabaseSessionResponse | null> {
    const path = this.buildSignupPath(redirectTo);
    const payload: Record<string, unknown> = { email, password };
    if (redirectTo) {
      payload.options = { emailRedirectTo: redirectTo };
    }
    const response = await this.post<SupabaseSessionResponse | null>(path, payload);
    return response;
  }

  async refreshSession(refreshToken: string): Promise<SupabaseSessionResponse> {
    return this.post<SupabaseSessionResponse>(
      '/auth/v1/token?grant_type=refresh_token',
      {
        refresh_token: refreshToken,
      },
      undefined,
      { unauthorizedOn400: true },
    );
  }

  async logout(accessToken: string): Promise<void> {
    await this.post('/auth/v1/logout', {}, accessToken).catch(() => {
      // Logout should not block client flows if Supabase rejects the token.
    });
  }

  private buildSignupPath(redirectTo?: string | null): string {
    if (!redirectTo) {
      return '/auth/v1/signup';
    }
    const encoded = encodeURIComponent(redirectTo);
    return `/auth/v1/signup?redirect_to=${encoded}`;
  }

  private async post<TResponse>(
    path: string,
    body: Record<string, unknown>,
    accessToken?: string,
    options?: { unauthorizedOn400?: boolean },
  ): Promise<TResponse> {
    const { supabaseUrl, anonKey } = this.getSupabaseConfig();
    const url = `${supabaseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken ?? anonKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: SupabaseErrorResponse | TResponse | null = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as SupabaseErrorResponse | TResponse;
      } catch {
        parsed = null;
      }
    }
    if (!response.ok) {
      const message =
        (parsed as SupabaseErrorResponse | null)?.error_description ||
        (parsed as SupabaseErrorResponse | null)?.error ||
        (parsed as SupabaseErrorResponse | null)?.msg ||
        'Supabase auth request failed';
      if (response.status === 401 || (response.status === 400 && options?.unauthorizedOn400)) {
        throw new UnauthorizedException(message);
      }
      throw new BadRequestException(message);
    }

    return parsed as TResponse;
  }

  private getSupabaseConfig(): { supabaseUrl: string; anonKey: string } {
    const rawUrl = this.config.get<string>('SUPABASE_URL')?.trim() ?? '';
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY')?.trim() ?? '';
    if (!rawUrl || !anonKey) {
      throw new BadRequestException('Supabase auth is not configured');
    }
    return { supabaseUrl: rawUrl.replace(/\/$/, ''), anonKey };
  }
}
