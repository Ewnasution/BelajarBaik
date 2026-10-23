import { addDays, monthRange, parseDate } from './dates.js';
export function occurrences(template, start, end) {
  const result = [];
  if (!template.active || template.startDate > end || (template.endDate && template.endDate < start)) return result;
  const anchor = parseDate(template.startDate);
  for (let key = start; key <= end; key = addDays(key, 1)) {
    if (key < template.startDate || (template.endDate && key > template.endDate)) continue;
    const d = parseDate(key);
    const dueDay = Math.min(template.dueDay || anchor.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
    const weekly = template.frequency === 'weekly' && d.getDay() === anchor.getDay();
    const monthly = template.frequency === 'monthly' && d.getDate() === dueDay;
    const yearly = template.frequency === 'yearly' && d.getMonth() === anchor.getMonth() && d.getDate() === dueDay;
    if (weekly || monthly || yearly) result.push({ ...template, occurrenceDate: key, occurrenceId: `${template.id}:${key}` });
  }
  return result;
}
export function financeSummary(data, month, today, range = {}) {
  const { start, end } = range.calendarBounds || monthRange(month);
  const monthlyTransactions = data.transactions.filter(t => t.date >= start && t.date <= end);
  const transactions = monthlyTransactions.filter(t => (!range.start || t.date >= range.start) && (!range.end || t.date <= range.end));
  const income = transactions.filter(t => t.type === 'income').reduce((n, t) => n + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((n, t) => n + t.amount, 0);
  const actualToDate = monthlyTransactions.filter(t => t.type === 'expense' && t.date <= today).reduce((n, t) => n + t.amount, 0);
  const allOccurrences = data.recurringExpenses.flatMap(r => occurrences(r, start, end));
  const unpaid = allOccurrences.filter(r => !data.transactions.some(t => t.recurringExpenseId === r.id && t.occurrenceDate === r.occurrenceDate));
  const upcoming = unpaid.filter(r => r.occurrenceDate >= today);
  return { transactions, income, expense, balance: income - expense, unpaid, allOccurrences, upcoming,
    projection: actualToDate + upcoming.reduce((n, r) => n + r.amount, 0) };
}
