import { useState } from 'react';
import { useStore } from '../data/store';
import { CATEGORY_COLORS } from '../types/index';

type EditingCategory = { id: string; name: string; description: string; color: string } | null;
type EditingSubQ = { id: string; text: string; description: string } | null;
type AddingSubQ = string | null; // categoryId

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
          data-color={c}
        />
      ))}
    </div>
  );
}

export function Categories() {
  const {
    categories, subQuestions,
    addCategory, updateCategory, deleteCategory,
    addSubQuestion, updateSubQuestion, deleteSubQuestion,
    moveSubQuestionUp, moveSubQuestionDown,
  } = useStore();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);

  const [editingCat, setEditingCat] = useState<EditingCategory>(null);
  const [editingSubQ, setEditingSubQ] = useState<EditingSubQ>(null);
  const [addingSubQFor, setAddingSubQFor] = useState<AddingSubQ>(null);
  const [newSubQText, setNewSubQText] = useState('');
  const [newSubQDesc, setNewSubQDesc] = useState('');

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({ name: newCatName.trim(), description: newCatDesc.trim() || undefined, color: newCatColor });
    setNewCatName('');
    setNewCatDesc('');
    setNewCatColor(CATEGORY_COLORS[0]);
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

  const handleAddSubQ = (categoryId: string) => {
    if (!newSubQText.trim()) return;
    addSubQuestion({
      text: newSubQText.trim(),
      categoryId,
      description: newSubQDesc.trim() || undefined,
    });
    setNewSubQText('');
    setNewSubQDesc('');
    setAddingSubQFor(null);
  };

  const handleUpdateSubQ = () => {
    if (!editingSubQ || !editingSubQ.text.trim()) return;
    updateSubQuestion(editingSubQ.id, {
      text: editingSubQ.text.trim(),
      description: editingSubQ.description.trim() || undefined,
    });
    setEditingSubQ(null);
  };

  const getSubQsSorted = (catId: string) =>
    subQuestions
      .filter((sq) => sq.categoryId === catId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
        const sqs = getSubQsSorted(cat.id);
        const isEditingCat = editingCat?.id === cat.id;

        return (
          <div key={cat.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Category header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-100">
              <div
                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                data-color={cat.color}
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
                  <p className="text-xs text-slate-400 mt-1">{sqs.length} שאלות משנה</p>
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

            {/* Sub-questions */}
            <div className="p-4 space-y-2">
              {sqs.map((sq, idx) => {
                const isEditingSq = editingSubQ?.id === sq.id;
                const isFirst = idx === 0;
                const isLast = idx === sqs.length - 1;

                return (
                  <div
                    key={sq.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5"
                  >
                    {/* Order controls */}
                    {!isEditingSq && (
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-indigo-600 w-5 text-center leading-none mb-1">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveSubQuestionUp(sq.id)}
                          disabled={isFirst}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
                          title="הזז למעלה"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSubQuestionDown(sq.id)}
                          disabled={isLast}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-25 disabled:cursor-not-allowed text-xs leading-none"
                          title="הזז למטה"
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    {isEditingSq ? (
                      <div className="flex-1 space-y-2">
                        <textarea
                          autoFocus
                          placeholder="טקסט השאלה"
                          value={editingSubQ.text}
                          onChange={(e) => setEditingSubQ({ ...editingSubQ, text: e.target.value })}
                          rows={2}
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <input
                          value={editingSubQ.description}
                          onChange={(e) =>
                            setEditingSubQ({ ...editingSubQ, description: e.target.value })
                          }
                          placeholder="הקשר/רקע (אופציונלי)"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleUpdateSubQ}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                          >
                            שמור
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubQ(null)}
                            className="px-3 py-1 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{sq.text}</p>
                          {sq.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{sq.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSubQ({
                                id: sq.id,
                                text: sq.text,
                                description: sq.description ?? '',
                              })
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                            title="ערוך"
                          >
                            ✏
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('למחוק שאלת משנה זו וכל החקירות שלה?'))
                                deleteSubQuestion(sq.id);
                            }}
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
              })}

              {/* Add sub-question form */}
              {addingSubQFor === cat.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    autoFocus
                    value={newSubQText}
                    onChange={(e) => setNewSubQText(e.target.value)}
                    placeholder="טקסט השאלה"
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <input
                    value={newSubQDesc}
                    onChange={(e) => setNewSubQDesc(e.target.value)}
                    placeholder="הקשר/רקע (אופציונלי)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddSubQ(cat.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                    >
                      הוסף שאלה
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingSubQFor(null);
                        setNewSubQText('');
                        setNewSubQDesc('');
                      }}
                      className="px-3 py-1.5 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingSubQFor(cat.id)}
                  className="w-full text-right text-xs text-indigo-600 hover:text-indigo-800 py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                >
                  + הוסף שאלת משנה
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
