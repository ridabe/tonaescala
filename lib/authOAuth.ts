import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export const authRedirectTo = 'tonaescala://auth/callback';

function dismissOAuthBrowser() {
  try {
    const result = WebBrowser.dismissBrowser() as unknown;
    // Suppress any Promise rejection from dismissBrowser without crashing
    if (result != null && typeof (result as { then?: unknown }).then === 'function') {
      (result as Promise<unknown>).then(undefined, () => {});
    }
  } catch {
    // dismissBrowser is not available on all platforms/versions.
  }
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // Best effort.
  }
}

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
  const returnUrl = Platform.OS === 'web' ? makeRedirectUri({ path: 'auth/callback' }) : authRedirectTo;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: returnUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Nao foi possivel iniciar o login com Google.');

  if (__DEV__) {
    console.log('[OAuth] redirectTo', returnUrl);
  }

  let subscription: { remove: () => void } | undefined;

  const deepLinkResult = new Promise<{ type: 'success'; url: string }>((resolve) => {
    subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        if (__DEV__) {
          console.log('[OAuth] deep link received', url);
        }
        dismissOAuthBrowser();
        resolve({ type: 'success', url });
      } catch (e) {
        if (__DEV__) {
          console.warn('[OAuth] error in deep link handler', e);
        }
      }
    });
  });

  let browserResult: Promise<WebBrowser.WebBrowserAuthSessionResult | WebBrowser.WebBrowserResult>;

  if (Platform.OS === 'android') {
    browserResult = WebBrowser.openBrowserAsync(data.url, {
      createTask: false,
      showTitle: true,
      toolbarColor: '#0F766E',
    });
  } else {
    browserResult = WebBrowser.openAuthSessionAsync(data.url, returnUrl);
  }

  const timeoutResult = new Promise<{ type: 'timeout' }>((resolve) => {
    setTimeout(() => resolve({ type: 'timeout' }), 90000);
  });

  const result = Platform.OS === 'android'
    ? await Promise.race([deepLinkResult, timeoutResult])
    : await Promise.race([browserResult, deepLinkResult, timeoutResult]);

  subscription?.remove();

  if (__DEV__) {
    console.log('[OAuth] browser result', result);
  }

  if (result.type === 'timeout') {
    throw new Error('Tempo esgotado aguardando o retorno do Google para o app.');
  }

  if (result.type === 'success') {
    return createSessionFromUrl(result.url);
  }

  return null;
}
