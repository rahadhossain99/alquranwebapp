import React, { useState } from 'react';
import { ArrowUpRight, Bookmark, Star, Trash2 } from 'lucide-react';
import { BookmarkItem, SurahMeta, UiLanguage } from '../types/quran';
import { toBengaliDigits } from '../utils/quranLogic';
import { AyahRosette } from './GeometricIcons';

interface BookmarksViewProps {
  bookmarks: BookmarkItem[];
  favoriteSurahs: number[];
  surahs: SurahMeta[];
  uiLanguage: UiLanguage;
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
  onOpenSurah: (surahNumber: number) => void;
  onToggleFavoriteSurah: (surahNumber: number) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onExploreSurahs: () => void;
}

type SavedSubTab = 'saved_ayahs' | 'favorites';

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  favoriteSurahs,
  surahs,
  uiLanguage,
  onOpenAyah,
  onOpenSurah,
  onToggleFavoriteSurah,
  onRemoveBookmark,
  onUpdateNote,
  onExploreSurahs,
}) => {
  const [subTab, setSubTab] = useState<SavedSubTab>('saved_ayahs');
  const isBn = uiLanguage === 'bn';
  const starredSurahs = surahs.filter((s) => favoriteSurahs.includes(s.number));

  return (
    <section
      aria-label={isBn ? 'সংরক্ষিত ও পছন্দের তালিকা' : 'Saved Ayahs & Favorite Surahs'}
      className="space-y-6 animate-neu-enter"
    >
      <div className="neu-raised rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
            {subTab === 'saved_ayahs'
              ? isBn
                ? 'সংরক্ষিত আয়াতসমূহ'
                : 'Saved Bookmarked Ayahs'
              : isBn
                ? 'পছন্দের সূরাসমূহ (স্টার চিহ্নিত)'
                : 'Favorite Surahs (Starred)'}
          </h1>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1 tabular-nums">
            {subTab === 'saved_ayahs'
              ? isBn
                ? `${toBengaliDigits(bookmarks.length)}টি সংরক্ষিত আয়াত ও নোট`
                : `${bookmarks.length} bookmarked verses & notes`
              : isBn
                ? `${toBengaliDigits(starredSurahs.length)}টি স্টার চিহ্নিত পছন্দের সূরা`
                : `${starredSurahs.length} starred favorite Surahs`}
          </p>
        </div>

        {/* Dedicated Separation: Bookmarked Ayahs vs Starred Favorite Surahs */}
        <div className="neu-inset p-1.5 rounded-2xl flex items-center gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('saved_ayahs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer tabular-nums ${
              subTab === 'saved_ayahs'
                ? 'neu-raised-sm text-[var(--neu-accent)]'
                : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>
              {isBn
                ? `সংরক্ষিত (${toBengaliDigits(bookmarks.length)})`
                : `Saved (${bookmarks.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('favorites')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer tabular-nums ${
              subTab === 'favorites'
                ? 'neu-raised-sm text-[var(--neu-gold)]'
                : 'text-[var(--neu-text-secondary)] hover:text-[var(--neu-text-primary)]'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>
              {isBn
                ? `পছন্দ (${toBengaliDigits(starredSurahs.length)})`
                : `Favorites (${starredSurahs.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Bookmarked Ayahs ONLY */}
      {subTab === 'saved_ayahs' && (
        <>
          {bookmarks.length === 0 ? (
            <div className="neu-raised rounded-3xl p-10 sm:p-14 text-center space-y-4">
              <div className="neu-inset w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-[var(--neu-accent)]">
                <Bookmark className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[var(--neu-text-primary)] font-bengali">
                {isBn ? 'এখনো কোনো আয়াত সংরক্ষিত নেই' : 'No saved Ayahs yet'}
              </h2>
              <p className="text-sm text-[var(--neu-text-secondary)] max-w-md mx-auto">
                {isBn
                  ? 'সূরা পড়ার সময় যেকোনো আয়াতের বুকমার্ক আইকনে ক্লিক করলে এখানে সংরক্ষিত হিসেবে দেখাবে।'
                  : 'Tap the bookmark icon on any Ayah while reading to save it here.'}
              </p>
              <button
                type="button"
                onClick={onExploreSurahs}
                className="neu-accent-btn px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer"
              >
                {isBn ? 'সূরাসমূহ দেখুন' : 'Explore Surahs'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {bookmarks.map((item) => {
                const refLabel = isBn
                  ? `${item.surahBengaliName} · আয়াত ${toBengaliDigits(item.surahNumber)}:${toBengaliDigits(item.ayahNumber)}`
                  : `${item.surahEnglishName} · Ayah ${item.surahNumber}:${item.ayahNumber}`;

                return (
                  <article
                    key={item.id}
                    className="neu-raised rounded-3xl p-6 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-[var(--neu-accent)] tabular-nums font-bengali">
                          {refLabel}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                            aria-label={isBn ? 'পাঠকক্ষে খুলুন' : 'Open in reader'}
                            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--neu-text-primary)] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isBn ? 'পড়ুন' : 'Read'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveBookmark(item.id)}
                            aria-label={isBn ? `${refLabel} মুছে ফেলুন` : `Remove ${refLabel}`}
                            className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-[var(--neu-text-muted)] hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p
                        dir="rtl"
                        className="font-quran text-2xl text-[var(--neu-text-primary)] leading-loose text-right"
                      >
                        {item.arabicPreview}
                      </p>

                      <p className="text-sm text-[var(--neu-text-secondary)] font-bengali leading-relaxed">
                        {isBn ? item.bengaliPreview : item.englishPreview}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`note-${item.id}`}
                        className="block text-[11px] font-semibold text-[var(--neu-text-muted)] mb-1.5"
                      >
                        {isBn ? 'ব্যক্তিগত নোট / তাফসির ভাবনা' : 'Personal Reflection Note'}
                      </label>
                      <textarea
                        id={`note-${item.id}`}
                        rows={2}
                        value={item.note}
                        onChange={(e) => onUpdateNote(item.id, e.target.value)}
                        placeholder={
                          isBn
                            ? 'এই আয়াত সম্পর্কে আপনার ভাবনা লিখুন...'
                            : 'Write a reflection note...'
                        }
                        className="w-full neu-inset rounded-2xl px-3.5 py-2.5 text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none resize-none"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Starred Favorite Surahs ONLY */}
      {subTab === 'favorites' && (
        <>
          {starredSurahs.length === 0 ? (
            <div className="neu-raised rounded-3xl p-10 sm:p-14 text-center space-y-4">
              <div className="neu-inset w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-[var(--neu-gold)]">
                <Star className="w-7 h-7 fill-current" />
              </div>
              <h2 className="text-lg font-bold text-[var(--neu-text-primary)] font-bengali">
                {isBn ? 'কোনো সূরা স্টার করা হয়নি' : 'No starred Surahs yet'}
              </h2>
              <p className="text-sm text-[var(--neu-text-secondary)] max-w-md mx-auto">
                {isBn
                  ? 'যেসব সূরার নামের পাশে স্টার (★) চিহ্ন দেবেন, কেবল সেগুলোই এখানে পছন্দ হিসেবে দেখাবে।'
                  : 'Surahs marked with the star (★) icon appear exclusively in this Favorites tab.'}
              </p>
              <button
                type="button"
                onClick={onExploreSurahs}
                className="neu-accent-btn px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer"
              >
                {isBn ? 'সূরাসমূহ দেখুন' : 'Explore Surahs'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {starredSurahs.map((s) => (
                <div
                  key={s.number}
                  className="neu-raised rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onOpenSurah(s.number)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <AyahRosette
                      label={isBn ? toBengaliDigits(s.number) : String(s.number)}
                      active
                      size={38}
                    />
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-bold text-[var(--neu-text-primary)] truncate font-bengali">
                        {isBn ? s.bengaliName : s.englishName}
                      </div>
                      <div className="text-[11px] text-[var(--neu-text-muted)] tabular-nums">
                        {isBn
                          ? `${toBengaliDigits(s.ayahCount)} আয়াত`
                          : `${s.ayahCount} Ayahs`}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFavoriteSurah(s.number)}
                    aria-label={
                      isBn
                        ? `${s.bengaliName} ফেভারিট থেকে সরান`
                        : `Remove ${s.englishName} from favorites`
                    }
                    className="neu-inset w-9 h-9 rounded-xl flex items-center justify-center text-[var(--neu-gold)] cursor-pointer shrink-0"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
