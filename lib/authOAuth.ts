import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export const authRedirectTo = 'minhaescala:///auth/callback';

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle() {
  const returnUrl =
    Platform.OS === 'web'
      ? makeRedirectUri({ path: 'auth/callback' })
      : authRedirectTo;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: returnUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Não foi possível iniciar o login com Google.');

  // openAuthSessionAsync closes the browser automatically when it detects
  // the redirect to our scheme, on both iOS and Android
  // (Android requires experimentalLauncherActivity: true in app.json, already configured)
  const result = await WebBrowser.openAuthSessionAsync(data.url, returnUrl, {
    showInRecents: false,
  });

  if (result.type === 'success') {
    return createSessionFromUrl(result.url);
  }

  return null;
}
