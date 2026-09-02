export interface UrlNavState {
  view?: 'spectator' | 'admin' | 'signup';
  share?: string;
  signupShareCode?: string;
}

export const getUrlNavState = (): UrlNavState => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // 1. 匹配 /signup/:code 或 /join/:code 或 /register/:code
  const signupMatch = path.match(/^\/(?:signup|join|register)\/([a-zA-Z0-9_-]+)/i);
  if (signupMatch) {
    return {
      view: 'signup',
      signupShareCode: signupMatch[1].toUpperCase(),
      share: signupMatch[1].toUpperCase(),
    };
  }

  const signupParam = params.get('signup') || params.get('register');
  if (signupParam) {
    return {
      view: 'signup',
      signupShareCode: signupParam.toUpperCase(),
      share: signupParam.toUpperCase(),
    };
  }

  // 2. 匹配 /spectate/:code 或 /live/:code
  const spectateMatch = path.match(/^\/(?:spectate|live)\/([a-zA-Z0-9_-]+)/i);
  if (spectateMatch) {
    return {
      view: 'spectator',
      share: spectateMatch[1].toUpperCase(),
    };
  }

  return {
    view: (params.get('view') as any) || 'spectator',
    share: params.get('v') || params.get('share') || undefined,
  };
};

export const updateUrlNavState = (updates: Partial<UrlNavState>) => {
  const current = getUrlNavState();
  const next: UrlNavState = { ...current, ...updates };

  const params = new URLSearchParams();

  if (next.view === 'signup' && next.signupShareCode) {
    const newUrl = `/signup/${next.signupShareCode}`;
    window.history.pushState(null, '', newUrl);
    return;
  }

  if (next.view === 'admin') {
    params.set('view', 'admin');
  }

  // v: 赛事 8 位短观赛码 (如 v=ZZM27GV5)
  if (next.share) {
    params.set('v', next.share);
  }

  const queryStr = params.toString();
  const newUrl = queryStr ? `/?${queryStr}` : '/';
  window.history.replaceState(null, '', newUrl);
};
