---
name: project-lifecycle
description: Manages research project lifecycle operations - archiving, creating, transitioning, and tracking project versions. Use this skill whenever the user wants to archive a project, create a new research project, transition between project versions, or manage relationships between predecessor and successor projects. Trigger phrases include "לארכב פרויקט", "להקים פרויקט חדש", "מעבר בין גרסאות", "פרויקט v2", archiving, project versioning, or any request involving project state changes.
---

# Project Lifecycle Skill

## מתי להשתמש

כאשר המשתמש מבקש:
- לארכב פרויקט קיים
- להקים פרויקט חדש (במיוחד עם קישור לקודמו)
- לנהל מעבר בין גרסאות פרויקט (v1 → v2)
- לשחזר או לצפות בפרויקט מאורכב

## עקרונות יסוד

1. **ארכוב ≠ מחיקה.** לעולם אין למחוק נתונים. ארכוב הוא שינוי סטטוס בלבד.
2. **שרשרת ירושה.** כל פרויקט חדש שמחליף פרויקט קודם חייב לשמור `predecessorProjectId`, והפרויקט הקודם מקבל `successorProjectId`. זה יוצר שרשור היסטורי דו-כיווני.
3. **בידוד נתונים.** קטגוריות של פרויקט מאורכב נשארות מקושרות אליו בלבד (`categoryProjectMap`). אין להעביר אותן לפרויקט החדש אוטומטית.
4. **ברירת מחדל בתצוגה.** פרויקטים מאורכבים לא מוצגים בברירת מחדל. נדרש פילטר/טאב נפרד.

## ארכיטקטורה טכנית

פרויקטים מנוהלים ב-`src/data/projectStore.ts` — Zustand store עם localStorage persistence.
- `projects[]` — רשימת כל הפרויקטים
- `activeProjectId` — הפרויקט הפעיל
- `categoryProjectMap` — מיפוי categoryId → projectId
- קטגוריות ללא מיפוי = שייכות ל-`periphery-v1` (ברירת מחדל לנתונים ישנים)

## נוהל ארכוב

1. ודא שהפרויקט באמת זה שהמשתמש התכוון אליו (אם יש ספק — שאל).
2. עדכן שדות: `status: 'archived'`, `archivedAt`, `archiveReason`.
3. אם יש פרויקט יורש — הוסף `successorProjectId`.
4. ודא שהתצוגה מסננת אותו כראוי.
5. Commit בעברית עם תיאור ברור.

## נוהל יצירת פרויקט חדש

1. דרוש מהמשתמש (או ודא שסופקו):
   - שם הפרויקט
   - שאלת מחקר
   - מסגרת מושגית (אופציונלי אך מומלץ)
   - האם יש פרויקט קודם?
2. יצירת אובייקט Project חדש עם `categories` ריקות (ב-`categoryProjectMap`).
3. **לעולם אל תאתחל תוכן מדעתך** — לא קטגוריות, לא תובנות, לא חקירות.
4. אם יש פרויקט קודם — עדכן קישור דו-כיווני.

## שדות חובה בסכמת Project

- `id`, `name`, `version`, `status`, `createdAt`
- `researchQuestion` (מחרוזת)
- `framework` (Record<string, string> של הגדרות מושגיות)
- `predecessorProjectId`, `successorProjectId` (string | null)
- `archivedAt`, `archiveReason` (רק לפרויקטים מאורכבים)

## בדיקות לפני commit

- [ ] כל הקישורים הדו-כיווניים תקינים?
- [ ] פרויקט מאורכב באמת לא מופיע בתצוגה הראשית?
- [ ] שום נתון של המשתמש לא נמחק?
- [ ] ה-build עובר? (`npm run build`)
