export interface UrlNavState {
  share?: string;
}

export const getUrlNavState = (): UrlNavState => {
  const params = new URLSearchParams(window.location.search);
  return {
    share: params.get('v') || params.get('share') || undefined,
  };
};

export const updateUrlNavState = (updates: Partial<UrlNavState>) => {
  const current = getUrlNavState();
  const next: UrlNavState = { ...current, ...updates };

  const params = new URLSearchParams();

  // 1. v: 赛事 8 位短观赛码 (如 v=ZZM27GV5，首页未选赛时无任何参数)
  if (next.share) {
    params.set('v', next.share);
  }

  const queryStr = params.toString();
  const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
};
