import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Share2 } from 'lucide-react';
import { AudioPlayerBar, FullPlayerDrawer } from './components/AudioPlayerBar';
import { BookmarksView } from './components/BookmarksView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { applyLiveFontVar } from './components/SmoothFontRange';
import { SurahDirectory } from './components/SurahDirectory';
import { SurahReader } from './components/SurahReader';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { SURAH_META } from './data/surahMeta';
import { fetchSurahDetail } from './services/quranApi';
import {
  AppView,
  Ayah,
  BookmarkItem,
  LastReadPosition,
  ListeningStats,
  ReaderSettings,
  ReciterId,
  SurahDetail,
} from './types/quran';
import {
  buildAppPath,
  createInitialListeningStats,
  formatShareAyahText,
  getAudioUrl,
  getGlobalAyahNumber,
  getNextAyahPointer,
  getPrevAyahPointer,
  parseAppRoute,
  recordListeningActivity,
  resolveReadingJumpTarget,
  toBengaliDigits,
  toggleBookmarkList,
  toggleFavoriteSurah,
} from './utils/quranLogic';
import { playUiClickSound } from './utils/soundEffects';

type ModalLayer = 'player' | 'playerDrawer' | 'miniJump' | 'miniFont';

interface AppHistoryState {
  view: AppView;
  surahNumber: number;
  modalLayer?: ModalLayer;
  drawerName?: Exclude<FullPlayerDrawer, null>;
}

const SETTINGS_KEY = 'al_noor_settings_v2';
const BOOKMARKS_KEY = 'al_noor_bookmarks_v1';
const FAVORITE_SURAHS_KEY = 'al_noor_favorite_surahs_v1';
const READ_AYAHS_KEY = 'al_noor_read_ayahs_v1';
const LAST_READ_KEY = 'al_noor_last_read_v1';
const LISTENING_STATS_KEY = 'al_noor_listening_stats_v1';

const DEFAULT_SETTINGS: ReaderSettings = {
  uiLanguage: 'bn',
  theme: 'light',
  arabicFontSize: 32,
  translationFontSize: 16,
  transliterationFontSize: 15,
  showBengali: true,
  showEnglish: false,
  showTransliteration: true,
  reciterId: 'ar.alafasy',
  playbackRate: 1,
  autoAdvance: true,
  soundEffects: true,
};

const DEFAULT_LAST_READ: LastReadPosition = {
  surahNumber: 1,
  ayahNumber: 1,
  updatedAt: new Date().toISOString(),
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const baseUrl = import.meta.env.BASE_URL || '/';

  const [settings, setSettings] = useState<ReaderSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readStorage<Partial<ReaderSettings>>(SETTINGS_KEY, {}),
    playbackRate: 1,
  }));

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    readStorage<BookmarkItem[]>(BOOKMARKS_KEY, [])
  );

  const [favoriteSurahs, setFavoriteSurahs] = useState<number[]>(() =>
    readStorage<number[]>(FAVORITE_SURAHS_KEY, [])
  );

  const [readAyahKeys, setReadAyahKeys] = useState<string[]>(() =>
    readStorage<string[]>(READ_AYAHS_KEY, [])
  );

  const [lastRead, setLastRead] = useState<LastReadPosition>(() =>
    readStorage<LastReadPosition>(LAST_READ_KEY, DEFAULT_LAST_READ)
  );

  const [listeningStats, setListeningStats] = useState<ListeningStats>(() => ({
    ...createInitialListeningStats(),
    ...readStorage<Partial<ListeningStats>>(LISTENING_STATS_KEY, {}),
  }));

  const initialRoute = useMemo(
    () => parseAppRoute(window.location.pathname, baseUrl),
    [baseUrl]
  );

  const [activeView, setActiveView] = useState<AppView>(initialRoute.view);
  const [activeSurahNumber, setActiveSurahNumber] = useState<number>(
    initialRoute.surahNumber ?? lastRead.surahNumber ?? 1
  );
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [toastNotice, setToastNotice] = useState<{
    message: string;
    kind: 'bookmark' | 'share';
    added?: boolean;
  } | null>(null);

  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSurah, setPlayingSurah] = useState<number>(
    initialRoute.surahNumber ?? lastRead.surahNumber ?? 1
  );
  const [playingAyah, setPlayingAyah] = useState<number>(
    lastRead.ayahNumber || 1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerDismissed, setPlayerDismissed] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [measuredDurations, setMeasuredDurations] = useState<
    Record<number, Record<number, number>>
  >({});
  const pendingSeekOffsetRef = useRef<number | null>(null);

  // Controlled overlay states for step-by-step Back navigation
  const [playerExpanded, setPlayerExpanded] = useState<boolean>(false);
  const [playerDrawer, setPlayerDrawer] = useState<FullPlayerDrawer>(null);
  const [miniJumpOpen, setMiniJumpOpen] = useState<boolean>(false);
  const [miniSettingsOpen, setMiniSettingsOpen] = useState<boolean>(false);
  const pendingJumpRef = useRef<{ surahNumber: number; ayahNumber: number } | null>(null);

  const activeSurahMeta = useMemo(
    () => SURAH_META.find((s) => s.number === activeSurahNumber) ?? SURAH_META[0],
    [activeSurahNumber]
  );

  const playingSurahMeta = useMemo(
    () => SURAH_META.find((s) => s.number === playingSurah) ?? SURAH_META[0],
    [playingSurah]
  );

  const currentAyahObj = useMemo(() => {
    if (surahDetail && playingSurah === activeSurahNumber) {
      return surahDetail.ayahs.find((a) => a.numberInSurah === playingAyah);
    }
    return undefined;
  }, [activeSurahNumber, playingAyah, playingSurah, surahDetail]);

  const readAyahSet = useMemo(() => new Set(readAyahKeys), [readAyahKeys]);

  // Seed initial history state on first mount so step-by-step Back unwinding always works cleanly
  useEffect(() => {
    const currentState = window.history.state as Partial<AppHistoryState> | null;
    if (!currentState || !currentState.view) {
      window.history.replaceState(
        {
          view: initialRoute.view,
          surahNumber: initialRoute.surahNumber ?? lastRead.surahNumber ?? 1,
        } satisfies AppHistoryState,
        '',
        window.location.pathname + window.location.search
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global tactile click sound on every interactive button/link
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!settings.soundEffects) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('button, a, [role="button"]')) {
        playUiClickSound(true);
      }
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [settings.soundEffects]);

  // Push modal history layer for overlays
  const pushModalHistory = useCallback(
    (modalLayer: ModalLayer, drawerName?: Exclude<FullPlayerDrawer, null>) => {
      const currentPath = window.location.pathname + window.location.search;
      window.history.pushState(
        {
          view: activeView,
          surahNumber: activeSurahNumber,
          modalLayer,
          ...(drawerName ? { drawerName } : {}),
        } satisfies AppHistoryState,
        '',
        currentPath
      );
    },
    [activeSurahNumber, activeView]
  );

  const handleToggleExpand = useCallback(() => {
    if (!playerExpanded) {
      setMiniJumpOpen(false);
      setMiniSettingsOpen(false);
      setPlayerDrawer(null);
      setPlayerExpanded(true);
      pushModalHistory('player');
    } else {
      const st = window.history.state as Partial<AppHistoryState> | null;
      if (st?.modalLayer === 'player' || st?.modalLayer === 'playerDrawer') {
        window.history.back();
      } else {
        setPlayerExpanded(false);
        setPlayerDrawer(null);
      }
    }
  }, [playerExpanded, pushModalHistory]);

  const handleCloseExpand = useCallback(() => {
    const st = window.history.state as Partial<AppHistoryState> | null;
    if (st?.modalLayer === 'player') {
      window.history.back();
    } else {
      setPlayerExpanded(false);
      setPlayerDrawer(null);
      if (st?.modalLayer === 'playerDrawer') {
        window.history.replaceState(
          { view: activeView, surahNumber: activeSurahNumber } satisfies AppHistoryState,
          '',
          window.location.pathname + window.location.search
        );
      }
    }
  }, [activeSurahNumber, activeView]);

  const handleToggleDrawer = useCallback(
    (target: Exclude<FullPlayerDrawer, null>) => {
      const st = window.history.state as Partial<AppHistoryState> | null;
      if (playerDrawer === target) {
        if (st?.modalLayer === 'playerDrawer') {
          window.history.back();
        } else {
          setPlayerDrawer(null);
        }
        return;
      }
      if (playerDrawer === null) {
        setPlayerDrawer(target);
        pushModalHistory('playerDrawer', target);
      } else {
        setPlayerDrawer(target);
        window.history.replaceState(
          {
            view: activeView,
            surahNumber: activeSurahNumber,
            modalLayer: 'playerDrawer',
            drawerName: target,
          } satisfies AppHistoryState,
          '',
          window.location.pathname + window.location.search
        );
      }
    },
    [activeSurahNumber, activeView, playerDrawer, pushModalHistory]
  );

  const handleCloseDrawer = useCallback(() => {
    const st = window.history.state as Partial<AppHistoryState> | null;
    if (st?.modalLayer === 'playerDrawer') {
      window.history.back();
    } else {
      setPlayerDrawer(null);
    }
  }, []);

  const handleToggleJumpOpen = useCallback(() => {
    if (!miniJumpOpen) {
      setMiniSettingsOpen(false);
      setMiniJumpOpen(true);
      pushModalHistory('miniJump');
    } else {
      const st = window.history.state as Partial<AppHistoryState> | null;
      if (st?.modalLayer === 'miniJump') {
        window.history.back();
      } else {
        setMiniJumpOpen(false);
      }
    }
  }, [miniJumpOpen, pushModalHistory]);

  const handleCloseJumpOpen = useCallback(() => {
    const st = window.history.state as Partial<AppHistoryState> | null;
    if (st?.modalLayer === 'miniJump') {
      window.history.back();
    } else {
      setMiniJumpOpen(false);
    }
  }, []);

  const handleToggleDockedSettings = useCallback(() => {
    if (!miniSettingsOpen) {
      setMiniJumpOpen(false);
      setMiniSettingsOpen(true);
      pushModalHistory('miniFont');
    } else {
      const st = window.history.state as Partial<AppHistoryState> | null;
      if (st?.modalLayer === 'miniFont') {
        window.history.back();
      } else {
        setMiniSettingsOpen(false);
      }
    }
  }, [miniSettingsOpen, pushModalHistory]);

  const handleCloseDockedSettings = useCallback(() => {
    const st = window.history.state as Partial<AppHistoryState> | null;
    if (st?.modalLayer === 'miniFont') {
      window.history.back();
    } else {
      setMiniSettingsOpen(false);
    }
  }, []);

  // Navigate with real slash URLs (/surah/:n, /surahs, /bookmarks, /progress, /settings)
  const navigateTo = useCallback(
    (view: AppView, surahNum: number = activeSurahNumber) => {
      setPlayerExpanded(false);
      setPlayerDrawer(null);
      setMiniJumpOpen(false);
      setMiniSettingsOpen(false);
      setActiveView(view);
      const nextPath = buildAppPath(view, surahNum, baseUrl);
      const currentState = window.history.state as Partial<AppHistoryState> | null;
      if (window.location.pathname !== nextPath || currentState?.modalLayer) {
        window.history.pushState(
          { view, surahNumber: surahNum } satisfies AppHistoryState,
          '',
          nextPath
        );
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeSurahNumber, baseUrl]
  );

  // Handle Browser / Android Back navigation step-by-step across overlays -> reader -> home
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const st = (e.state ?? {}) as Partial<AppHistoryState>;
      const layer = st.modalLayer;

      setPlayerExpanded(layer === 'player' || layer === 'playerDrawer');
      setPlayerDrawer(layer === 'playerDrawer' ? (st.drawerName ?? null) : null);
      setMiniJumpOpen(layer === 'miniJump');
      setMiniSettingsOpen(layer === 'miniFont');

      const parsed = parseAppRoute(window.location.pathname, baseUrl);
      const nextView = st.view ?? parsed.view;
      const nextSurah = st.surahNumber ?? parsed.surahNumber;
      setActiveView(nextView);
      if (nextSurah) {
        setActiveSurahNumber(nextSurah);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [baseUrl]);

  // Dynamic page title per slash route
  useEffect(() => {
    const isBn = settings.uiLanguage === 'bn';
    const appTitle = isBn ? 'আল-নূর কুরআন' : 'Al-Noor Quran';
    if (activeView === 'surahs') {
      document.title = `${isBn ? 'সকল সূরা' : 'Surahs'} — ${appTitle}`;
    } else if (activeView === 'bookmarks') {
      document.title = `${isBn ? 'সংরক্ষিত আয়াত' : 'Saved Ayahs'} — ${appTitle}`;
    } else if (activeView === 'progress') {
      document.title = `${isBn ? 'অগ্রগতি' : 'Progress'} — ${appTitle}`;
    } else if (activeView === 'settings') {
      document.title = `${isBn ? 'সেটিংস' : 'Settings'} — ${appTitle}`;
    } else {
      document.title = `${
        isBn ? activeSurahMeta.bengaliName : activeSurahMeta.englishName
      } — ${appTitle}`;
    }
  }, [activeSurahMeta, activeView, settings.uiLanguage]);

  // Sync theme class & live root CSS font variables on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = settings.uiLanguage;

    applyLiveFontVar('arabicFontSize', settings.arabicFontSize);
    applyLiveFontVar('translationFontSize', settings.translationFontSize);
    applyLiveFontVar('transliterationFontSize', settings.transliterationFontSize);

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage error
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_SURAHS_KEY, JSON.stringify(favoriteSurahs));
    } catch {
      // Ignore
    }
  }, [favoriteSurahs]);

  useEffect(() => {
    try {
      localStorage.setItem(READ_AYAHS_KEY, JSON.stringify(readAyahKeys));
    } catch {
      // Ignore
    }
  }, [readAyahKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));
    } catch {
      // Ignore
    }
  }, [lastRead]);

  useEffect(() => {
    try {
      localStorage.setItem(LISTENING_STATS_KEY, JSON.stringify(listeningStats));
    } catch {
      // Ignore
    }
  }, [listeningStats]);

  // Live session timer: increments ONLY when audio recitation is actively playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setListeningStats((prev) => recordListeningActivity(prev, 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // Load Surah Verses
  useEffect(() => {
    let cancelled = false;
    setLoadingSurah(true);
    setSurahError(null);

    fetchSurahDetail(activeSurahNumber)
      .then((detail) => {
        if (!cancelled) {
          setSurahDetail(detail);
          setLoadingSurah(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSurahError(err instanceof Error ? err.message : 'Network error');
          setLoadingSurah(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSurahNumber, reloadNonce]);

  const jumpToAyahElement = useCallback(
    (ayahNumber: number) => {
      setHighlightedAyah(ayahNumber);
      if (!isPlaying) {
        setPlayingAyah(ayahNumber);
      }
      const el = document.getElementById(`ayah-${ayahNumber}`);
      if (el) {
        const dist = Math.abs(el.getBoundingClientRect().top);
        el.scrollIntoView({
          behavior: dist > 1600 ? 'instant' : 'smooth',
          block: 'center',
        });
      }
      setTimeout(() => {
        setHighlightedAyah((curr) => (curr === ayahNumber ? null : curr));
      }, 2200);
    },
    [isPlaying]
  );

  // Execute deferred jump reliably once target Surah reader & DOM are ready
  useEffect(() => {
    const target = pendingJumpRef.current;
    if (!target) return;
    if (activeView !== 'reader' || loadingSurah) return;
    if (surahDetail?.meta.number !== target.surahNumber) return;

    pendingJumpRef.current = null;
    const raf = window.requestAnimationFrame(() => {
      jumpToAyahElement(target.ayahNumber);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [activeView, activeSurahNumber, loadingSurah, surahDetail, jumpToAyahElement]);

  const handleSelectSurah = useCallback(
    (surahNumber: number, ayahNumber = 1) => {
      setPlayerExpanded(false);
      setPlayerDrawer(null);
      setMiniJumpOpen(false);
      setMiniSettingsOpen(false);

      pendingJumpRef.current =
        ayahNumber > 1 ? { surahNumber, ayahNumber } : null;

      setActiveSurahNumber(surahNumber);
      setActiveView('reader');
      const nextPath = buildAppPath('reader', surahNumber, baseUrl);
      const currentState = window.history.state as Partial<AppHistoryState> | null;
      if (window.location.pathname !== nextPath) {
        window.history.pushState(
          { view: 'reader', surahNumber } satisfies AppHistoryState,
          '',
          nextPath
        );
      } else if (currentState?.modalLayer) {
        window.history.replaceState(
          { view: 'reader', surahNumber } satisfies AppHistoryState,
          '',
          nextPath
        );
      }

      setLastRead({
        surahNumber,
        ayahNumber,
        updatedAt: new Date().toISOString(),
      });
      if (!isPlaying) {
        setPlayingSurah(surahNumber);
        setPlayingAyah(ayahNumber);
      }

      if (
        activeView === 'reader' &&
        !loadingSurah &&
        surahDetail?.meta.number === surahNumber
      ) {
        pendingJumpRef.current = null;
        if (ayahNumber > 1) {
          window.requestAnimationFrame(() => jumpToAyahElement(ayahNumber));
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (ayahNumber <= 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [activeView, baseUrl, isPlaying, jumpToAyahElement, loadingSurah, surahDetail]
  );

  const readingTarget = useMemo(
    () => resolveReadingJumpTarget(isPlaying, playingSurah, playingAyah, lastRead),
    [isPlaying, lastRead, playingAyah, playingSurah]
  );

  const handleJumpToReadingPosition = useCallback(() => {
    const target = readingTarget;
    setPlayerExpanded(false);
    setPlayerDrawer(null);
    setMiniJumpOpen(false);
    setMiniSettingsOpen(false);

    pendingJumpRef.current = target;
    setActiveSurahNumber(target.surahNumber);
    setActiveView('reader');

    const nextPath = buildAppPath('reader', target.surahNumber, baseUrl);
    const currentState = window.history.state as Partial<AppHistoryState> | null;
    if (window.location.pathname !== nextPath) {
      window.history.pushState(
        { view: 'reader', surahNumber: target.surahNumber } satisfies AppHistoryState,
        '',
        nextPath
      );
    } else if (currentState?.modalLayer) {
      window.history.replaceState(
        { view: 'reader', surahNumber: target.surahNumber } satisfies AppHistoryState,
        '',
        nextPath
      );
    }

    if (!isPlaying) {
      setPlayingSurah(target.surahNumber);
      setPlayingAyah(target.ayahNumber);
    }

    if (
      activeView === 'reader' &&
      !loadingSurah &&
      surahDetail?.meta.number === target.surahNumber
    ) {
      pendingJumpRef.current = null;
      window.requestAnimationFrame(() => jumpToAyahElement(target.ayahNumber));
    }
  }, [
    activeView,
    baseUrl,
    isPlaying,
    jumpToAyahElement,
    loadingSurah,
    readingTarget,
    surahDetail,
  ]);

  // Audio playback controls
  const startAudioAt = useCallback(
    (surahNum: number, ayahNum: number, overrideReciterId?: ReciterId) => {
      const audio = audioRef.current;
      if (!audio) return;

      const effectiveReciter = overrideReciterId ?? settings.reciterId;
      const globalNum = getGlobalAyahNumber(SURAH_META, surahNum, ayahNum);
      const url = getAudioUrl(globalNum, effectiveReciter);

      setListeningStats((prev) => recordListeningActivity(prev, 0));

      setPlayerDismissed(false);
      setPlayingSurah(surahNum);
      setPlayingAyah(ayahNum);
      setAudioNotice(null);
      setLastRead({
        surahNumber: surahNum,
        ayahNumber: ayahNum,
        updatedAt: new Date().toISOString(),
      });

      if (surahNum === activeSurahNumber && activeView === 'reader') {
        const el = document.getElementById(`ayah-${ayahNum}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (audio.src !== url) {
        audio.src = url;
      }
      audio.defaultPlaybackRate = 1;
      audio.playbackRate = 1;
      audio.muted = muted;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (audioRef.current) {
              audioRef.current.defaultPlaybackRate = 1;
              audioRef.current.playbackRate = 1;
            }
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
            setAudioNotice(
              settings.uiLanguage === 'bn'
                ? 'অডিও স্ট্রিম লোড করা যায়নি'
                : 'Audio stream unavailable'
            );
          });
      }
    },
    [
      activeSurahNumber,
      activeView,
      muted,
      settings.reciterId,
      settings.uiLanguage,
    ]
  );

  // Changing Qari updates settings AND automatically updates live recitation immediately
  const handleUpdateSettings = useCallback(
    (partial: Partial<ReaderSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial, playbackRate: 1 }));

      if (partial.reciterId && partial.reciterId !== settings.reciterId) {
        if (isPlaying) {
          startAudioAt(playingSurah, playingAyah, partial.reciterId);
        } else if (audioRef.current) {
          const globalNum = getGlobalAyahNumber(
            SURAH_META,
            playingSurah,
            playingAyah
          );
          audioRef.current.src = getAudioUrl(globalNum, partial.reciterId);
          audioRef.current.defaultPlaybackRate = 1;
          audioRef.current.playbackRate = 1;
          setCurrentTime(0);
          setDuration(0);
          setAudioNotice(null);
        }
      }
    },
    [isPlaying, playingAyah, playingSurah, settings.reciterId, startAudioAt]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.defaultPlaybackRate = 1;
      audioRef.current.playbackRate = 1;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const handleTogglePlayMain = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else if (audio.src) {
      setListeningStats((prev) => recordListeningActivity(prev, 0));
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAudioNotice(null);
        })
        .catch(() => {
          startAudioAt(playingSurah, playingAyah);
        });
    } else {
      startAudioAt(activeSurahNumber, playingAyah || 1);
    }
  }, [activeSurahNumber, isPlaying, playingAyah, playingSurah, startAudioAt]);

  const handlePlayAyah = useCallback(
    (ayahNumber: number) => {
      if (
        isPlaying &&
        playingSurah === activeSurahNumber &&
        playingAyah === ayahNumber
      ) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        startAudioAt(activeSurahNumber, ayahNumber);
      }
    },
    [activeSurahNumber, isPlaying, playingAyah, playingSurah, startAudioAt]
  );

  const handlePlaySurah = useCallback(() => {
    if (isPlaying && playingSurah === activeSurahNumber) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      startAudioAt(activeSurahNumber, 1);
    }
  }, [activeSurahNumber, isPlaying, playingSurah, startAudioAt]);

  const handleNextAyah = useCallback(() => {
    const next = getNextAyahPointer(SURAH_META, playingSurah, playingAyah);
    if (!next) {
      setIsPlaying(false);
      return;
    }
    if (next.surahNumber !== activeSurahNumber && activeView === 'reader') {
      setActiveSurahNumber(next.surahNumber);
    }
    startAudioAt(next.surahNumber, next.ayahNumber);
  }, [activeSurahNumber, activeView, playingAyah, playingSurah, startAudioAt]);

  const handlePrevAyah = useCallback(() => {
    const prev = getPrevAyahPointer(SURAH_META, playingSurah, playingAyah);
    if (!prev) return;
    if (prev.surahNumber !== activeSurahNumber && activeView === 'reader') {
      setActiveSurahNumber(prev.surahNumber);
    }
    startAudioAt(prev.surahNumber, prev.ayahNumber);
  }, [activeSurahNumber, activeView, playingAyah, playingSurah, startAudioAt]);

  const handleAudioEnded = useCallback(() => {
    const key = `${playingSurah}:${playingAyah}`;
    setReadAyahKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));

    if (settings.autoAdvance) {
      const next = getNextAyahPointer(SURAH_META, playingSurah, playingAyah);
      if (next) {
        if (next.surahNumber !== activeSurahNumber && activeView === 'reader') {
          setActiveSurahNumber(next.surahNumber);
        }
        startAudioAt(next.surahNumber, next.ayahNumber);
        return;
      }
    }
    setIsPlaying(false);
  }, [
    activeSurahNumber,
    activeView,
    playingAyah,
    playingSurah,
    settings.autoAdvance,
    startAudioAt,
  ]);

  const handleSeekSurahPosition = useCallback(
    (targetSurah: number, ayahNumber: number, offsetInAyah: number) => {
      const safeOffset = Math.max(0, offsetInAyah);
      if (targetSurah === playingSurah && ayahNumber === playingAyah) {
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.currentTime = safeOffset;
          setCurrentTime(safeOffset);
        }
        return;
      }

      pendingSeekOffsetRef.current = safeOffset;
      if (isPlaying) {
        startAudioAt(targetSurah, ayahNumber);
      } else {
        setPlayingSurah(targetSurah);
        setPlayingAyah(ayahNumber);
        setCurrentTime(safeOffset);
        if (targetSurah === activeSurahNumber && activeView === 'reader') {
          setHighlightedAyah(ayahNumber);
          const el = document.getElementById(`ayah-${ayahNumber}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (audioRef.current) {
          const globalNum = getGlobalAyahNumber(SURAH_META, targetSurah, ayahNumber);
          audioRef.current.src = getAudioUrl(globalNum, settings.reciterId);
          audioRef.current.defaultPlaybackRate = 1;
          audioRef.current.playbackRate = 1;
        }
      }
    },
    [
      activeSurahNumber,
      activeView,
      isPlaying,
      playingAyah,
      playingSurah,
      settings.reciterId,
      startAudioAt,
    ]
  );

  const handleToggleBookmark = useCallback(
    (ayah: Ayah) => {
      const id = `${activeSurahMeta.number}:${ayah.numberInSurah}`;
      const alreadyExists = bookmarks.some((b) => b.id === id);

      const newItem: BookmarkItem = {
        id,
        surahNumber: activeSurahMeta.number,
        ayahNumber: ayah.numberInSurah,
        surahEnglishName: activeSurahMeta.englishName,
        surahBengaliName: activeSurahMeta.bengaliName,
        arabicPreview: ayah.arabic,
        bengaliPreview: ayah.bengali,
        englishPreview: ayah.english,
        note: '',
        createdAt: new Date().toISOString(),
      };
      setBookmarks((prev) => toggleBookmarkList(prev, newItem));

      const isBn = settings.uiLanguage === 'bn';
      const msg = alreadyExists
        ? isBn
          ? `বুকমার্ক সরানো হয়েছে — ${activeSurahMeta.bengaliName} (${toBengaliDigits(activeSurahMeta.number)}:${toBengaliDigits(ayah.numberInSurah)})`
          : `Bookmark removed — ${activeSurahMeta.englishName} (${activeSurahMeta.number}:${ayah.numberInSurah})`
        : isBn
          ? `বুকমার্ক হয়েছে — ${activeSurahMeta.bengaliName} (${toBengaliDigits(activeSurahMeta.number)}:${toBengaliDigits(ayah.numberInSurah)})`
          : `Bookmarked — ${activeSurahMeta.englishName} (${activeSurahMeta.number}:${ayah.numberInSurah})`;

      setToastNotice({ message: msg, kind: 'bookmark', added: !alreadyExists });
    },
    [activeSurahMeta, bookmarks, settings.uiLanguage]
  );

  const handleShareAyah = useCallback(
    async (
      surahMetaItem = activeSurahMeta,
      ayahObj: Ayah | undefined = currentAyahObj,
      ayahNum: number = playingAyah
    ) => {
      const isBn = settings.uiLanguage === 'bn';
      const shareUrl = `${window.location.origin}${buildAppPath(
        'reader',
        surahMetaItem.number,
        baseUrl
      )}`;
      const text = ayahObj
        ? formatShareAyahText(
            surahMetaItem,
            ayahObj.arabic,
            ayahObj.bengali,
            ayahObj.transliteration,
            ayahObj.numberInSurah,
            isBn
          )
        : isBn
          ? `${surahMetaItem.bengaliName} — ${surahMetaItem.arabicName}`
          : `${surahMetaItem.englishName} — ${surahMetaItem.arabicName}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: isBn ? surahMetaItem.bengaliName : surahMetaItem.englishName,
            text,
            url: shareUrl,
          });
          setToastNotice({
            kind: 'share',
            message: isBn ? 'শেয়ার সম্পন্ন হয়েছে' : 'Shared successfully',
          });
          return;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }

      try {
        await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
        setToastNotice({
          kind: 'share',
          message: isBn
            ? `শেয়ারের জন্য কপি হয়েছে (${toBengaliDigits(surahMetaItem.number)}:${toBengaliDigits(ayahNum)})`
            : `Copied to clipboard for sharing (${surahMetaItem.number}:${ayahNum})`,
        });
      } catch {
        setToastNotice({
          kind: 'share',
          message: isBn ? 'শেয়ার করতে কপি করুন' : 'Ready to share',
        });
      }
    },
    [activeSurahMeta, baseUrl, currentAyahObj, playingAyah, settings.uiLanguage]
  );

  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => setToastNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  const handleAutoMarkAyahRead = useCallback(
    (ayahNumber: number) => {
      if (playerExpanded) return;
      const key = `${activeSurahNumber}:${ayahNumber}`;
      setReadAyahKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      if (
        activeView === 'reader' &&
        !loadingSurah &&
        !pendingJumpRef.current &&
        !isPlaying &&
        (ayahNumber > 1 || window.scrollY > 40)
      ) {
        setLastRead({
          surahNumber: activeSurahNumber,
          ayahNumber,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [activeSurahNumber, activeView, isPlaying, loadingSurah, playerExpanded]
  );

  const handleToggleFavoriteSurah = useCallback(
    (surahNumber: number) => {
      const already = favoriteSurahs.includes(surahNumber);
      setFavoriteSurahs((prev) => toggleFavoriteSurah(prev, surahNumber));
      const surah = SURAH_META.find((s) => s.number === surahNumber);
      if (surah) {
        const isBn = settings.uiLanguage === 'bn';
        setToastNotice({
          kind: 'bookmark',
          added: !already,
          message: already
            ? isBn
              ? `ফেভারিট থেকে সরানো হয়েছে — ${surah.bengaliName}`
              : `Removed from Favorites — ${surah.englishName}`
            : isBn
              ? `পছন্দের তালিকায় যুক্ত হয়েছে — ${surah.bengaliName}`
              : `Added to Favorites — ${surah.englishName}`,
        });
      }
    },
    [favoriteSurahs, settings.uiLanguage]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--neu-bg)] text-[var(--neu-text-primary)] pb-32">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.defaultPlaybackRate = 1;
            audioRef.current.playbackRate = 1;
            const dur = audioRef.current.duration || 0;
            setDuration(dur);
            if (dur > 0) {
              setMeasuredDurations((prev) => ({
                ...prev,
                [playingSurah]: {
                  ...(prev[playingSurah] ?? {}),
                  [playingAyah]: dur,
                },
              }));
            }
            if (pendingSeekOffsetRef.current !== null) {
              const offset = Math.min(
                Math.max(0, pendingSeekOffsetRef.current),
                dur > 0.2 ? dur - 0.1 : 0
              );
              pendingSeekOffsetRef.current = null;
              audioRef.current.currentTime = offset;
              setCurrentTime(offset);
            }
          }
        }}
        onPlay={() => {
          if (audioRef.current) {
            audioRef.current.defaultPlaybackRate = 1;
            audioRef.current.playbackRate = 1;
          }
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
          setAudioNotice(
            settings.uiLanguage === 'bn'
              ? 'অডিও স্ট্রিম লোড করা যায়নি'
              : 'Audio stream unavailable'
          );
        }}
      />

      <TopBar
        activeView={activeView}
        activeSurahNumber={activeSurahNumber}
        onSelectView={(v) => navigateTo(v)}
        uiLanguage={settings.uiLanguage}
        lastRead={{ ...readingTarget, updatedAt: lastRead.updatedAt }}
        savedCount={bookmarks.length}
        onResumeReading={handleJumpToReadingPosition}
      />

      {/* Bookmark & Share Feedback Toast */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 neu-raised rounded-2xl px-4 py-3 flex items-center gap-3 animate-neu-enter max-w-sm"
        >
          {toastNotice.kind === 'share' ? (
            <Share2 className="w-4 h-4 shrink-0 text-[var(--neu-accent)]" />
          ) : (
            <Bookmark
              className={`w-4 h-4 shrink-0 ${
                toastNotice.added
                  ? 'text-[var(--neu-gold)] fill-current'
                  : 'text-[var(--neu-text-muted)]'
              }`}
            />
          )}
          <span className="text-xs sm:text-sm font-semibold text-[var(--neu-text-primary)] font-bengali">
            {toastNotice.message}
          </span>
          {toastNotice.kind === 'bookmark' && toastNotice.added && (
            <button
              type="button"
              onClick={() => {
                navigateTo('bookmarks');
                setToastNotice(null);
              }}
              className="neu-btn px-2.5 py-1 rounded-xl text-xs font-semibold text-[var(--neu-accent)] cursor-pointer whitespace-nowrap"
            >
              {settings.uiLanguage === 'bn' ? 'দেখুন' : 'View'}
            </button>
          )}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <WorkspaceToolbar
          activeView={activeView}
          activeSurahNumber={activeSurahNumber}
          onSelectView={(v) => navigateTo(v)}
          uiLanguage={settings.uiLanguage}
        />

        {activeView === 'reader' && (
          <SurahReader
            surahMeta={activeSurahMeta}
            surahDetail={surahDetail}
            loading={loadingSurah}
            error={surahError}
            onRetry={() => setReloadNonce((n) => n + 1)}
            settings={settings}
            activePlayingAyah={
              playingSurah === activeSurahNumber ? playingAyah : null
            }
            playingAyahDuration={
              playingSurah === activeSurahNumber ? duration : undefined
            }
            highlightedAyah={highlightedAyah}
            isPlaying={isPlaying}
            bookmarks={bookmarks}
            favoriteSurahs={favoriteSurahs}
            readAyahKeys={readAyahSet}
            onPlayAyah={handlePlayAyah}
            onPlaySurah={handlePlaySurah}
            onToggleBookmark={handleToggleBookmark}
            onToggleFavoriteSurah={handleToggleFavoriteSurah}
            onAutoMarkAyahRead={handleAutoMarkAyahRead}
            onNavigateSurah={(num) => handleSelectSurah(num, 1)}
            onOpenSurahList={() => navigateTo('surahs')}
            onShareAyah={(ayah) =>
              handleShareAyah(activeSurahMeta, ayah, ayah.numberInSurah)
            }
          />
        )}

        {activeView === 'surahs' && (
          <SurahDirectory
            surahs={SURAH_META}
            activeSurahNumber={activeSurahNumber}
            playingSurahNumber={playingSurah}
            isPlaying={isPlaying}
            favoriteSurahs={favoriteSurahs}
            uiLanguage={settings.uiLanguage}
            onSelectSurah={(num) => handleSelectSurah(num, 1)}
            onToggleFavoriteSurah={handleToggleFavoriteSurah}
          />
        )}

        {activeView === 'bookmarks' && (
          <BookmarksView
            bookmarks={bookmarks}
            favoriteSurahs={favoriteSurahs}
            surahs={SURAH_META}
            uiLanguage={settings.uiLanguage}
            onOpenAyah={(s, a) => handleSelectSurah(s, a)}
            onOpenSurah={(s) => handleSelectSurah(s, 1)}
            onToggleFavoriteSurah={handleToggleFavoriteSurah}
            onRemoveBookmark={(id) =>
              setBookmarks((prev) => prev.filter((b) => b.id !== id))
            }
            onUpdateNote={(id, note) =>
              setBookmarks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, note } : b))
              )
            }
            onExploreSurahs={() => navigateTo('surahs')}
          />
        )}

        {activeView === 'progress' && (
          <ProgressView
            readAyahKeys={readAyahKeys}
            listeningStats={listeningStats}
            uiLanguage={settings.uiLanguage}
            onResetStats={() => {
              setReadAyahKeys([]);
              setListeningStats(createInitialListeningStats());
            }}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      <AudioPlayerBar
        surah={activeView === 'reader' ? activeSurahMeta : playingSurahMeta}
        playingSurahNumber={playingSurah}
        currentAyah={playingAyah}
        currentAyahObj={currentAyahObj}
        surahAyahs={
          surahDetail &&
          surahDetail.meta.number ===
            (activeView === 'reader' ? activeSurahMeta.number : playingSurahMeta.number)
            ? surahDetail.ayahs
            : undefined
        }
        measuredAyahDurations={
          measuredDurations[
            activeView === 'reader' ? activeSurahMeta.number : playingSurahMeta.number
          ]
        }
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        muted={muted}
        settings={settings}
        audioNotice={audioNotice}
        showJumpButton={activeView === 'reader'}
        dismissed={playerDismissed}
        onDismiss={() => setPlayerDismissed(true)}
        onRestore={() => setPlayerDismissed(false)}
        onTogglePlay={handleTogglePlayMain}
        onPrevAyah={handlePrevAyah}
        onNextAyah={handleNextAyah}
        onSeek={(time) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
          }
        }}
        onSeekSurahTime={(ayahNumber, offsetInAyah) =>
          handleSeekSurahPosition(
            activeView === 'reader' ? activeSurahMeta.number : playingSurahMeta.number,
            ayahNumber,
            offsetInAyah
          )
        }
        onToggleMute={() => setMuted((m) => !m)}
        onUpdateSettings={handleUpdateSettings}
        onJumpToAyah={(ayahNum) => {
          const targetSurah =
            activeView === 'reader' ? activeSurahMeta.number : playingSurahMeta.number;
          if (!isPlaying) {
            setLastRead({
              surahNumber: targetSurah,
              ayahNumber: ayahNum,
              updatedAt: new Date().toISOString(),
            });
          }
          jumpToAyahElement(ayahNum);
        }}
        onSelectPart={(startAyah, openInReader) => {
          const targetSurah =
            activeView === 'reader' ? activeSurahMeta.number : playingSurahMeta.number;
          if (openInReader) {
            handleSelectSurah(targetSurah, startAyah);
          } else {
            if (!isPlaying) {
              setLastRead({
                surahNumber: targetSurah,
                ayahNumber: startAyah,
                updatedAt: new Date().toISOString(),
              });
            }
            jumpToAyahElement(startAyah);
          }
          if (isPlaying) {
            startAudioAt(targetSurah, startAyah);
          }
        }}
        onSelectSurah={(surahNum) => {
          handleSelectSurah(surahNum, 1);
          if (isPlaying) {
            startAudioAt(surahNum, 1);
          }
        }}
        onShareCurrent={() =>
          handleShareAyah(
            activeView === 'reader' ? activeSurahMeta : playingSurahMeta,
            currentAyahObj,
            playingAyah
          )
        }
        onOpenSettings={() => navigateTo('settings')}
        onGoToReadingPosition={handleJumpToReadingPosition}
        expanded={playerExpanded}
        activeDrawer={playerDrawer}
        jumpOpen={miniJumpOpen}
        dockedSettingsOpen={miniSettingsOpen}
        onToggleExpand={handleToggleExpand}
        onCloseExpand={handleCloseExpand}
        onToggleDrawer={handleToggleDrawer}
        onCloseDrawer={handleCloseDrawer}
        onToggleJumpOpen={handleToggleJumpOpen}
        onCloseJumpOpen={handleCloseJumpOpen}
        onToggleDockedSettings={handleToggleDockedSettings}
        onCloseDockedSettings={handleCloseDockedSettings}
      />
    </div>
  );
}
