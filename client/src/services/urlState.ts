export interface UrlNavState {
  view?: 'spectator' | 'admin';
  share?: string;
  tab?: 'mindmap' | 'details';
  stage?: string;
}

export const getUrlNavState = (): UrlNavState => {
  const params = new URLSearchParams(window.location.search);
  return {
    view: (params.get('view') === 'admin' ? 'admin' : 'spectator') as 'spectator' | 'admin',
    share: params.get('share') || undefined,
    tab: (params.get('tab') === 'details' ? 'details' : 'mindmap') as 'mindmap' | 'details',
    stage: params.get('stage') || undefined,
  };
};

export const updateUrlNavState = (updates: Partial<UrlNavState>) => {
  const params = new URLSearchParams(window.location.search);

  if (updates.view !== undefined) {
    if (updates.view === 'admin') {
      params.set('view', 'admin');
    } else {
      params.delete('view'); // 默认 spectator
    }
  }

  if (updates.share !== undefined) {
    if (updates.share) {
      params.set('share', updates.share);
    } else {
      params.delete('share');
    }
  }

  if (updates.tab !== undefined) {
    if (updates.tab === 'details') {
      params.set('tab', 'details');
    } else {
      params.delete('tab'); // 默认 mindmap
    }
  }

  if (updates.stage !== undefined) {
    if (updates.stage) {
      params.set('stage', updates.stage);
    } else {
      params.delete('stage');
    }
  }

  const queryStr = params.toString();
  const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
};
