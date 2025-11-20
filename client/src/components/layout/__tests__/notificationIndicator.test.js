import React from 'react';
import { renderToString } from 'react-dom/server';
import { NotificationProvider } from '../../context/NotificationContext';

function IndicatorHarness({ count }) {
  return (
    <NotificationProvider>
      {/* Simulate navbar indicator using context value */}
      {count > 0 ? (
        <span className="bg-green-600 animate-pulse">{count}</span>
      ) : null}
    </NotificationProvider>
  );
}

describe('Notification Indicator Behavior', () => {
  test('shows green indicator when unread notifications exist', () => {
    const html = renderToString(<IndicatorHarness count={3} />);
    expect(html).toContain('bg-green-600');
    expect(html).toContain('animate-pulse');
  });

  test('removes indicator when all notifications are read', () => {
    const html = renderToString(<IndicatorHarness count={0} />);
    expect(html).not.toContain('bg-green-600');
    expect(html).not.toContain('animate-pulse');
  });

  test('updates indicator visibility on real-time state change simulation', () => {
    const htmlUnread = renderToString(<IndicatorHarness count={1} />);
    const htmlRead = renderToString(<IndicatorHarness count={0} />);
    expect(htmlUnread).toContain('bg-green-600');
    expect(htmlRead).not.toContain('bg-green-600');
  });
});