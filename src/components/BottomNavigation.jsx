import { useRef, useState, useEffect } from 'react';
import './BottomNavigation.css';

// 아이콘 컴포넌트
const MoneyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SchoolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const iconMap = {
  '💰': MoneyIcon,
  '🎓': SchoolIcon,
  '📋': ClipboardIcon,
};

function BottomNavigation({ items, currentPath }) {
  const scrollRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    // 메뉴가 3개 이하면 스크롤 체크하지 않음 (균등 분배)
    if (items.length <= 3) {
      setShowLeftScroll(false);
      setShowRightScroll(false);
      return;
    }

    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [items]);

  return (
    <nav className="bottom-navigation">
      <div className="bottom-nav-wrapper">
        {showLeftScroll && (
          <div className="scroll-indicator scroll-indicator-left"></div>
        )}
        <div className="bottom-nav-container" ref={scrollRef}>
          {items.map((item, index) => {
            const isActive = currentPath === item.path ||
                            (item.path !== '/' && currentPath?.startsWith(item.path));

            const IconComponent = iconMap[item.icon];

            return (
              <a
                key={index}
                href={item.url}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="bottom-nav-icon">
                  {IconComponent ? <IconComponent /> : item.icon}
                </div>
                <span className="bottom-nav-label">{item.label}</span>
              </a>
            );
          })}
        </div>
        {showRightScroll && (
          <div className="scroll-indicator scroll-indicator-right"></div>
        )}
      </div>
    </nav>
  );
}

export default BottomNavigation;
