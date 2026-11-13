import React from 'react';
import { ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';
import { BookmarkItem, UiLanguage } from '../types/quran';
import { toBengaliDigits } from '../utils/quranLogic';

interface BookmarksViewProps {
  bookmarks: BookmarkItem[];
  uiLanguage: UiLanguage;
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onExploreSurahs: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  uiLanguage,
  onOpenAyah,
  onRemoveBookmark,
  onUpdateNote,
  onExploreSurahs,
}) => {
  const isBn = uiLanguage === 'bn';

  return (
    <section aria-label={isBn ? 'সংরক্ষিত আয়াতসমূহ' : 'Bookmarked Ayahs'} className="space-y-6">
      <div className="neu-raised rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'সংরক্ষিত আয়াত ও নোট' : 'Saved Ayahs & Reflections'}
          </h1>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-1 tabular-nums">
            {isBn
              ? `মোট ${toBengaliDigits(bookmarks.length)}টি আয়াত সংরক্ষিত আছে`
              : `${bookmarks.length} bookmarked verses`}
          </p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="neu-raised rounded-3xl p-10 sm:p-14 text-center space-y-4">
          <div className="neu-inset w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-[var(--neu-gold)]">
            <Bookmark className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--neu-text-primary)] font-bengali">
            {isBn ? 'এখনো কোনো আয়াত সংরক্ষিত নেই' : 'No saved verses yet'}
          </h2>
          <p className="text-sm text-[var(--neu-text-secondary)] max-w-md mx-auto">
            {isBn
              ? 'কুরআন পাঠ করার সময় যেকোনো আয়াতের বুকমার্ক আইকনে ক্লিক করে এখানে সংরক্ষণ ও ব্যক্তিগত নোট লিখতে পারবেন।'
              : 'Tap the bookmark button on any Ayah while reading to save it here along with your personal reflections.'}
          </p>
          <button
            type="button"
            onClick={onExploreSurahs}
            className="neu-accent-btn px-5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer"
          >
            {isBn ? 'সূরা পড়তে শুরু করুন' : 'Start Reading'}
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

                  <p dir="rtl" className="font-quran text-2xl text-[var(--neu-text-primary)] leading-loose text-right">
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
                      isBn ? 'এই আয়াত সম্পর্কে আপনার ভাবনা লিখুন...' : 'Write a reflection note...'
                    }
                    className="w-full neu-inset rounded-2xl px-3.5 py-2.5 text-sm text-[var(--neu-text-primary)] placeholder:text-[var(--neu-text-muted)] focus:outline-none resize-none"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
