import { useState } from 'react';
import { useStore } from '../data/store';
import { CATEGORY_COLORS } from '../types/index';
import type { SubCategory, SubQuestion } from '../types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

type EditingCategory = { id: string; name: string; description: string; color: string } | null;
type EditingSubQ = { id: string; text: string; description: string; number: string } | null;

// Which category is showing the "add sub-category" form
type AddingSubCatFor = string | null; // categoryId
// Which category is showing the "add sub-question" form
type AddingSubQFor = string | null; // categoryId

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          title={`בחר צבע ${c}`}
          aria-label={`בחר צבע ${c}`}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${
            value === c ? 'border-slate-800 scale-125' : 'border-transparent hover:scale-110'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

// ─── SubQuestion row ──────────────────────────────────────────────────────────

interface SubQRowProps {
  sq: SubQuestion;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editingSubQ: EditingSubQ;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  setEditingSubQ: (v: EditingSubQ) => void;
}

function SubQRow({
  sq, idx, isFirst, isLast,
  onMoveUp, onMoveDown, onEdit, onDelete,
  editingSubQ, onSaveEdit, onCancelEdit, setEditingSubQ,
}: SubQRowProps) {
  const isEditing = editingSubQ?.id === sq.id;

  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
      {!isEditing && (
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-indigo-600 w-5 text-center leading-none mb-1">
            {idx + 1}
          </span>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
            title="הזז למעלה"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
            title="הזז למטה"
          >
            ▼
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={editingSubQ!.number}
              onChange={(e) => setEditingSubQ({ ...editingSubQ!, number: e.target.value })}
              placeholder="מספר (אופציונלי, למשל 0.1)"
              className="w-28 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dir="ltr"
            />
          </div>
          <textarea
            value={editingSubQ!.text}
            onChange={(e) => setEditingSubQ({ ...editingSubQ!, text: e.target.value })}
            placeholder="טקסט השאלה"
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <input
            value={editingSubQ!.description}
            onChange={(e) => setEditingSubQ({ ...editingSubQ!, description: e.target.value })}
            placeholder="הקשר/רקע (אופציונלי)"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveEdit}
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">
              {sq.number && (
                <span className="font-mono text-indigo-500 ml-1 text-xs">{sq.number} —</span>
              )}
              {sq.text}
            </p>
            {sq.description && (
              <p className="text-xs text-slate-400 mt-0.5">{sq.description}</p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
              title="ערוך"
            >
              ✏
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="מחק"
            >
              🗑
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── InlineEdit — click text to edit, blur to save ───────────────────────────

interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

function InlineEdit({ value, onSave, className = '', placeholder = '', multiline = false }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-amber-50 rounded px-1 -mx-1 transition-colors ${className}`}
        onClick={() => { setDraft(value); setEditing(true); }}
        title="לחץ לעריכה"
      >
        {value || <span className="text-slate-400 italic">{placeholder}</span>}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
        rows={2}
        className={`border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none w-full ${className}`}
      />
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className={`border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    />
  );
}

// ─── SubCategory section ──────────────────────────────────────────────────────

interface SubCatSectionProps {
  sc: SubCategory;
  sqs: SubQuestion[];
  editingSubQ: EditingSubQ;
  setEditingSubQ: (v: EditingSubQ) => void;
  onSaveSubQ: () => void;
  onDeleteSubCat: (id: string) => void;
  onUpdateSubCat: (id: string, updates: { name?: string; description?: string }) => void;
  onMoveSubCatUp: (id: string) => void;
  onMoveSubCatDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  moveSubQuestionUp: (id: string) => void;
  moveSubQuestionDown: (id: string) => void;
  deleteSubQuestion: (id: string) => void;
}

function SubCatSection({
  sc, sqs,
  editingSubQ, setEditingSubQ, onSaveSubQ,
  onDeleteSubCat, onUpdateSubCat,
  onMoveSubCatUp, onMoveSubCatDown, isFirst, isLast,
  moveSubQuestionUp, moveSubQuestionDown, deleteSubQuestion,
}: SubCatSectionProps) {
  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden mb-3">
      {/* SubCategory header */}
      <div className="flex items-start gap-2 bg-amber-50 px-4 py-3 border-b border-amber-100">
        <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => onMoveSubCatUp(sc.id)}
            disabled={isFirst}
            className="w-5 h-5 flex items-center justify-center text-amber-400 hover:text-amber-700 hover:bg-amber-100 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
            title="הזז למעלה"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMoveSubCatDown(sc.id)}
            disabled={isLast}
            className="w-5 h-5 flex items-center justify-center text-amber-400 hover:text-amber-700 hover:bg-amber-100 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
            title="הזז למטה"
          >
            ▼
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={sc.name}
            onSave={(v) => v && onUpdateSubCat(sc.id, { name: v })}
            className="font-semibold text-amber-900 text-sm"
            placeholder="שם תת-קטגוריה"
          />
          {sc.description !== undefined && (
            <div className="mt-0.5">
              <InlineEdit
                value={sc.description}
                onSave={(v) => onUpdateSubCat(sc.id, { description: v || undefined })}
                className="text-xs text-amber-700"
                placeholder="תיאור (לחץ להוספה)"
                multiline
              />
            </div>
          )}
          <p className="text-xs text-amber-500 mt-1">{sqs.length} שאלות</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`למחוק תת-קטגוריה "${sc.name}"?\nשאלות המשנה שלה יישארו ויועברו ישירות לקטגוריה.`))
              onDeleteSubCat(sc.id);
          }}
          className="p-1.5 text-amber-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
          title="מחק תת-קטגוריה"
        >
          🗑
        </button>
      </div>

      {/* SubCategory's sub-questions */}
      <div className="p-3 space-y-2 bg-white">
        {sqs.map((sq, idx) => (
          <SubQRow
            key={sq.id}
            sq={sq}
            idx={idx}
            isFirst={idx === 0}
            isLast={idx === sqs.length - 1}
            onMoveUp={() => moveSubQuestionUp(sq.id)}
            onMoveDown={() => moveSubQuestionDown(sq.id)}
            onEdit={() => setEditingSubQ({ id: sq.id, text: sq.text, description: sq.description ?? '', number: sq.number ?? '' })}
            onDelete={() => { if (confirm('למחוק שאלת משנה זו וכל החקירות שלה?')) deleteSubQuestion(sq.id); }}
            editingSubQ={editingSubQ}
            onSaveEdit={onSaveSubQ}
            onCancelEdit={() => setEditingSubQ(null)}
            setEditingSubQ={setEditingSubQ}
          />
        ))}
        {sqs.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">אין שאלות בתת-קטגוריה זו עדיין</p>
        )}
      </div>
    </div>
  );
}

// ─── AddSubQuestionForm ───────────────────────────────────────────────────────

interface AddSubQFormProps {
  subCategories: SubCategory[];
  onAdd: (text: string, desc: string, number: string, subCategoryId: string | null) => void;
  onCancel: () => void;
}

function AddSubQForm({ subCategories, onAdd, onCancel }: AddSubQFormProps) {
  const [text, setText] = useState('');
  const [desc, setDesc] = useState('');
  const [number, setNumber] = useState('');
  const [subCatId, setSubCatId] = useState<string | null>(null);

  const handle = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), desc.trim(), number.trim(), subCatId);
    setText(''); setDesc(''); setNumber(''); setSubCatId(null);
  };

  return (
    <div className="space-y-2 pt-1 border border-indigo-100 rounded-xl p-3 bg-indigo-50/40">
      <div className="flex gap-2">
        <input
          dir="ltr"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="מספר (למשל 0.1)"
          className="w-28 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {subCategories.length > 0 && (
          <select
            value={subCatId ?? ''}
            onChange={(e) => setSubCatId(e.target.value || null)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">ללא תת-קטגוריה</option>
            {subCategories.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>
        )}
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="טקסט השאלה"
        rows={2}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="הקשר/רקע (אופציונלי)"
        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handle}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
        >
          הוסף שאלה
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

// ─── AddSubCategoryForm ───────────────────────────────────────────────────────

interface AddSubCatFormProps {
  onAdd: (name: string, desc: string) => void;
  onCancel: () => void;
}

function AddSubCatForm({ onAdd, onCancel }: AddSubCatFormProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handle = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), desc.trim());
    setName(''); setDesc('');
  };

  return (
    <div className="space-y-2 border border-amber-200 rounded-xl p-3 bg-amber-50/40">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם תת-קטגוריה"
        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        onKeyDown={(e) => e.key === 'Enter' && handle()}
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="תיאור (אופציונלי)"
        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handle}
          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600"
        >
          הוסף תת-קטגוריה
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

// ─── Main Categories view ─────────────────────────────────────────────────────

export function Categories() {
  const {
    categories, subQuestions,
    addCategory, updateCategory, deleteCategory,
    addSubCategory, updateSubCategory, deleteSubCategory, reorderSubCategories,
    getSubCategoriesByCategory, getSubQuestionsBySubCategory, getDirectSubQuestionsByCategory,
    addSubQuestion, updateSubQuestion, deleteSubQuestion,
    moveSubQuestionUp, moveSubQuestionDown,
  } = useStore();

  // ── Category form state ──
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [editingCat, setEditingCat] = useState<EditingCategory>(null);

  // ── Sub-question edit state (shared across all categories) ──
  const [editingSubQ, setEditingSubQ] = useState<EditingSubQ>(null);

  // ── Per-category add-form state ──
  const [addingSubQFor, setAddingSubQFor] = useState<AddingSubQFor>(null);
  const [addingSubCatFor, setAddingSubCatFor] = useState<AddingSubCatFor>(null);

  // ── Category CRUD ──────────────────────────────────────────
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ name: newCatName.trim(), description: newCatDesc.trim() || undefined, color: newCatColor });
    setNewCatName(''); setNewCatDesc(''); setNewCatColor(CATEGORY_COLORS[0]);
    setShowAddCategory(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCat || !editingCat.name.trim()) return;
    updateCategory(editingCat.id, {
      name: editingCat.name.trim(),
      description: editingCat.description.trim() || undefined,
      color: editingCat.color,
    });
    setEditingCat(null);
  };

  // ── SubQuestion CRUD ───────────────────────────────────────
  const handleAddSubQ = (categoryId: string, text: string, desc: string, number: string, subCatId: string | null) => {
    addSubQuestion({
      text,
      categoryId,
      description: desc || undefined,
      number: number || undefined,
      subCategoryId: subCatId,
    });
    setAddingSubQFor(null);
  };

  const handleUpdateSubQ = () => {
    if (!editingSubQ || !editingSubQ.text.trim()) return;
    updateSubQuestion(editingSubQ.id, {
      text: editingSubQ.text.trim(),
      description: editingSubQ.description.trim() || undefined,
      number: editingSubQ.number.trim() || undefined,
    });
    setEditingSubQ(null);
  };

  // ── SubCategory CRUD ───────────────────────────────────────
  const handleAddSubCat = (categoryId: string, name: string, desc: string) => {
    addSubCategory(categoryId, { name, description: desc || undefined });
    setAddingSubCatFor(null);
  };

  const handleMoveSubCatUp = (categoryId: string, id: string) => {
    const sorted = getSubCategoriesByCategory(categoryId);
    const idx = sorted.findIndex((sc) => sc.id === id);
    if (idx <= 0) return;
    const newOrder = sorted.map((sc) => sc.id);
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    reorderSubCategories(categoryId, newOrder);
  };

  const handleMoveSubCatDown = (categoryId: string, id: string) => {
    const sorted = getSubCategoriesByCategory(categoryId);
    const idx = sorted.findIndex((sc) => sc.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const newOrder = sorted.map((sc) => sc.id);
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    reorderSubCategories(categoryId, newOrder);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">קטגוריות ושאלות משנה</h1>
        <button
          type="button"
          onClick={() => setShowAddCategory(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + קטגוריה חדשה
        </button>
      </div>

      {/* Add category form */}
      {showAddCategory && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800">קטגוריה חדשה</h3>
          <input
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="שם הקטגוריה"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <textarea
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="תיאור (אופציונלי)"
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <div>
            <p className="text-xs text-slate-500 mb-1">צבע</p>
            <ColorPicker value={newCatColor} onChange={setNewCatColor} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={() => setShowAddCategory(false)}
              className="px-4 py-1.5 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && !showAddCategory && (
        <p className="text-slate-400 text-sm text-center py-8">
          אין קטגוריות עדיין. לחץ "קטגוריה חדשה" להתחיל.
        </p>
      )}

      {/* Categories list */}
      {categories.map((cat) => {
        const catSubCats = getSubCategoriesByCategory(cat.id);
        const directSQs = getDirectSubQuestionsByCategory(cat.id);
        const totalSQs = subQuestions.filter((sq) => sq.categoryId === cat.id).length;
        const isEditingCat = editingCat?.id === cat.id;

        return (
          <div key={cat.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-100">
              <div
                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {isEditingCat ? (
                <div className="flex-1 space-y-2">
                  <input
                    autoFocus
                    placeholder="שם הקטגוריה"
                    value={editingCat.name}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={editingCat.description}
                    onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                    placeholder="תיאור"
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <ColorPicker
                    value={editingCat.color}
                    onChange={(c) => setEditingCat({ ...editingCat, color: c })}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleUpdateCategory}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                    >
                      שמור
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="px-3 py-1 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{cat.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {totalSQs} שאלות משנה
                    {catSubCats.length > 0 && ` · ${catSubCats.length} תת-קטגוריות`}
                  </p>
                </div>
              )}
              {!isEditingCat && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCat({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description ?? '',
                        color: cat.color,
                      })
                    }
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    title="ערוך קטגוריה"
                  >
                    ✏
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`למחוק קטגוריה "${cat.name}" וכל שאלות המשנה שלה?`))
                        deleteCategory(cat.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="מחק קטגוריה"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>

            {/* Body: sub-categories + direct sub-questions */}
            <div className="p-4 space-y-2">

              {/* 1. SubCategories */}
              {catSubCats.map((sc, scIdx) => {
                const scSQs = getSubQuestionsBySubCategory(sc.id);
                return (
                  <SubCatSection
                    key={sc.id}
                    sc={sc}
                    sqs={scSQs}
                    editingSubQ={editingSubQ}
                    setEditingSubQ={setEditingSubQ}
                    onSaveSubQ={handleUpdateSubQ}
                    onDeleteSubCat={(id) => deleteSubCategory(id)}
                    onUpdateSubCat={(id, updates) => updateSubCategory(id, updates)}
                    onMoveSubCatUp={(id) => handleMoveSubCatUp(cat.id, id)}
                    onMoveSubCatDown={(id) => handleMoveSubCatDown(cat.id, id)}
                    isFirst={scIdx === 0}
                    isLast={scIdx === catSubCats.length - 1}
                    moveSubQuestionUp={moveSubQuestionUp}
                    moveSubQuestionDown={moveSubQuestionDown}
                    deleteSubQuestion={deleteSubQuestion}
                  />
                );
              })}

              {/* 2. Direct sub-questions (no sub-category) */}
              {directSQs.length > 0 && (
                <div className="space-y-2">
                  {catSubCats.length > 0 && (
                    <p className="text-xs font-medium text-slate-400 pt-1 px-1">שאלות ללא תת-קטגוריה</p>
                  )}
                  {directSQs.map((sq, idx) => (
                    <SubQRow
                      key={sq.id}
                      sq={sq}
                      idx={idx}
                      isFirst={idx === 0}
                      isLast={idx === directSQs.length - 1}
                      onMoveUp={() => moveSubQuestionUp(sq.id)}
                      onMoveDown={() => moveSubQuestionDown(sq.id)}
                      onEdit={() =>
                        setEditingSubQ({
                          id: sq.id,
                          text: sq.text,
                          description: sq.description ?? '',
                          number: sq.number ?? '',
                        })
                      }
                      onDelete={() => {
                        if (confirm('למחוק שאלת משנה זו וכל החקירות שלה?'))
                          deleteSubQuestion(sq.id);
                      }}
                      editingSubQ={editingSubQ}
                      onSaveEdit={handleUpdateSubQ}
                      onCancelEdit={() => setEditingSubQ(null)}
                      setEditingSubQ={setEditingSubQ}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {totalSQs === 0 && catSubCats.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">אין שאלות משנה עדיין</p>
              )}

              {/* 3. Add sub-category form */}
              {addingSubCatFor === cat.id ? (
                <AddSubCatForm
                  onAdd={(name, desc) => handleAddSubCat(cat.id, name, desc)}
                  onCancel={() => setAddingSubCatFor(null)}
                />
              ) : null}

              {/* 4. Add sub-question form */}
              {addingSubQFor === cat.id ? (
                <AddSubQForm
                  subCategories={catSubCats}
                  onAdd={(text, desc, number, subCatId) =>
                    handleAddSubQ(cat.id, text, desc, number, subCatId)
                  }
                  onCancel={() => setAddingSubQFor(null)}
                />
              ) : null}

              {/* 5. Add buttons (shown when no form is open) */}
              {addingSubCatFor !== cat.id && addingSubQFor !== cat.id && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setAddingSubCatFor(cat.id); setAddingSubQFor(null); }}
                    className="flex-1 text-center text-xs text-amber-600 hover:text-amber-800 py-1.5 px-3 rounded-lg hover:bg-amber-50 border border-dashed border-amber-200"
                  >
                    + הוסף תת-קטגוריה
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingSubQFor(cat.id); setAddingSubCatFor(null); }}
                    className="flex-1 text-center text-xs text-indigo-600 hover:text-indigo-800 py-1.5 px-3 rounded-lg hover:bg-indigo-50 border border-dashed border-indigo-200"
                  >
                    + הוסף שאלה
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
