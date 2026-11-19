import { NavLink } from 'react-router-dom';

interface TabBarProps {
  onOpenAdd: () => void;
}

export function TabBar({ onOpenAdd }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="主导航">
      <NavLink to="/" end className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
        </svg>
        <span>首页</span>
      </NavLink>

      <NavLink to="/list" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6.5h11M9 12h11M9 17.5h11" />
          <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.4" />
        </svg>
        <span>明细</span>
      </NavLink>

      <div className="tab-plus">
        <button
          type="button"
          className="fab"
          onClick={onOpenAdd}
          aria-label="记一笔"
          data-testid="fab-add"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <NavLink to="/stats" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.6V13.5z" />
          <path d="M14 3.2a8.5 8.5 0 0 1 6.8 6.8H14z" />
        </svg>
        <span>统计</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20.5c.6-3.8 3.7-6.3 7.5-6.3s6.9 2.5 7.5 6.3" />
        </svg>
        <span>我的</span>
      </NavLink>
    </nav>
  );
}
