import { useCallback, useEffect, useState } from 'react';
import { fetchDeletedCategories, restoreCategory } from '../lib/api/categories';
import { fetchDeletedSubCategories, restoreSubCategory } from '../lib/api/subCategories';
import { fetchDeletedSubQuestions, restoreSubQuestion } from '../lib/api/subQuestions';
import { fetchDeletedInvestigations, restoreInvestigation } from '../lib/api/investigations';
import { fetchDeletedInsights, restoreInsight } from '../lib/api/insights';
import { fetchDeletedFinalOutputs, restoreFinalOutput } from '../lib/api/finalOutputs';
import { fetchDeletedSourceExcerpts, restoreSourceExcerpt } from '../lib/api/sourceExcerpts';
import { useStore } from '../data/store';
import { logger } from '../lib/logger';
import type {
  Category,
  Investigation,
  Insight,
  FinalOutput,
  SourceExcerpt,
  SubCategory,
  SubQuestion,
} from '../types/index';

/**
 * ArchiveView — אתר שחזור לכל מה שמשתמש "מחק" בפועל.
 *
 * מימוש CLAUDE.md "ארכוב בלבד": שכבת ה-API לא מוחקת פיזית —
 * היא מסמנת `deleted_at`. המסך הזה קורא את הרשומות המסומנות
 * ומאפשר שחזור (לסמן `deleted_at = null`).
 */

type ArchiveBucket =
  | { kind: 'categories';       items: Category[] }
  | { kind: 'sub_categories';   items: SubCategory[] }
  | { kind: 'sub_questions';    items: SubQuestion[] }
  | { kind: 'investigations';   items: Investigation[] }
  | { kind: 'insights';         items: Insight[] }
  | { kind: 'final_outputs';    items: FinalOutput[] }
  | { kind: 'source_excerpts';  items: SourceExcerpt[] };

const SECTION_TITLES: Record<ArchiveBucket['kind'], string> = {
  categories:      'קטגוריות',
  sub_categories:  'תת-קטגוריות',
  sub_questions:   'שאלות משנה',
  investigations:  'חקירות',
  insights:        'תובנות',
  final_outputs:   'תוצרים סופיים',
  source_excerpts: 'ציטוטים',
};

export function ArchiveView() {
  const [buckets, setBuckets] = useState<ArchiveBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrate = useStore((s) => s.hydrateFromSupabase);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cats, subCats, subQs, invs, ins, finals, srcs] = await Promise.all([
        fetchDeletedCategories(),
        fetchDeletedSubCategories(),
        fetchDeletedSubQuestions(),
        fetchDeletedInvestigations(),
        fetchDeletedInsights(),
        fetchDeletedFinalOutputs(),
        fetchDeletedSourceExcerpts(),
      ]);
      setBuckets([
        { kind: 'categories',      items: cats },
        { kind: 'sub_categories',  items: subCats },
        { kind: 'sub_questions',   items: subQs },
        { kind: 'investigations',  items: invs },
        { kind: 'insights',        items: ins },
        { kind: 'final_outputs',   items: finals },
        { kind: 'source_excerpts', items: srcs },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאה לא ידועה';
      logger.error('archive', 'load failed', e);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = useCallback(async (kind: ArchiveBucket['kind'], id: string) => {
    try {
      switch (kind) {
        case 'categories':      await restoreCategory(id);      break;
        case 'sub_categories':  await restoreSubCategory(id);   break;
        case 'sub_questions':   await restoreSubQuestion(id);   break;
        case 'investigations':  await restoreInvestigation(id); break;
        case 'insights':        await restoreInsight(id);       break;
        case 'final_outputs':   await restoreFinalOutput(id);   break;
        case 'source_excerpts': await restoreSourceExcerpt(id); break;
      }
      await Promise.all([load(), hydrate()]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאה בשחזור';
      logger.error('archive', 'restore failed', e);
      setError(msg);
    }
  }, [load, hydrate]);

  const totalItems = buckets.reduce((sum, b) => sum + b.items.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ארכיון</h1>
        <p className="text-sm text-slate-600 mt-1">
          כל הפריטים שסומנו למחיקה נשמרים כאן וניתנים לשחזור בלחיצה.
        </p>
      </header>

      {error && (
        <div role="alert" className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 text-sm" aria-live="polite">טוען ארכיון…</div>
      ) : totalItems === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600 text-sm">הארכיון ריק — שום דבר לא סומן למחיקה.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {buckets.map((bucket) => (
            <ArchiveSection
              key={bucket.kind}
              title={SECTION_TITLES[bucket.kind]}
              bucket={bucket}
              onRestore={(id) => handleRestore(bucket.kind, id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveSection({
  title,
  bucket,
  onRestore,
}: {
  title: string;
  bucket: ArchiveBucket;
  onRestore: (id: string) => void;
}) {
  if (bucket.items.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 mb-2">
        {title}{' '}
        <span className="text-slate-400 font-normal">({bucket.items.length})</span>
      </h2>
      <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {bucket.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm text-slate-800 truncate">{labelOf(bucket.kind, item)}</span>
            <button
              type="button"
              onClick={() => onRestore(item.id)}
              className="flex-shrink-0 text-xs px-3 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
              aria-label={`שחזר ${labelOf(bucket.kind, item)}`}
            >
              שחזר
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function labelOf(kind: ArchiveBucket['kind'], item: ArchiveBucket['items'][number]): string {
  switch (kind) {
    case 'categories':
    case 'sub_categories':
      return (item as Category | SubCategory).name;
    case 'sub_questions':
      return (item as SubQuestion).text;
    case 'investigations':
    case 'final_outputs':
      return (item as Investigation | FinalOutput).title;
    case 'insights':
      return (item as Insight).text;
    case 'source_excerpts': {
      const s = item as SourceExcerpt;
      return `"${s.quotedText.slice(0, 80)}${s.quotedText.length > 80 ? '…' : ''}"`;
    }
  }
}
