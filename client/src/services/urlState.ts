export interface UrlNavState {
  share?: string;
  stage?: string;
}

export const getUrlNavState = (): UrlNavState => {
  const params = new URLSearchParams(window.location.search);
  return {
    share: params.get('share') || undefined,
    stage: params.get('stage') || undefined,
  };
};

export const updateUrlNavState = (updates: Partial<UrlNavState>) => {
  const current = getUrlNavState();
  const next: UrlNavState = { ...current, ...updates };

  const params = new URLSearchParams();

  // 1. share: 赛事 8 位短分享码 (如 share=ZZM27GV5，首页未选赛时无任何参数)
  if (next.share) {
    params.set('share', next.share);
  }

  // 2. stage: 赛段序号 (stage=2, stage=3 等；第 1 赛段/初赛默认省略)
  if (next.stage && next.stage !== '1') {
    params.set('stage', next.stage);
  }

  const queryStr = params.toString();
  const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
};
