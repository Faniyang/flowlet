import { Navigate, Route, Routes } from 'react-router-dom';
import { BudgetPage } from './features/budget/BudgetPage';
import { HomePage } from './features/home/HomePage';
import { ListPage } from './features/list/ListPage';
import { CategoryEditor } from './features/settings/CategoryEditor';
import { ImportExport } from './features/settings/ImportExport';
import { SettingsPage } from './features/settings/SettingsPage';
import { TagManager } from './features/settings/TagManager';
import { StatsPage } from './features/stats/StatsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/list" element={<ListPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/categories" element={<CategoryEditor />} />
      <Route path="/settings/tags" element={<TagManager />} />
      <Route path="/settings/io" element={<ImportExport />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
