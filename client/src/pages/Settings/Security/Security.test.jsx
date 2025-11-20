
import React from 'react';
import { render, screen } from '@testing-library/react';
import SecurityTab from '../../../components/settings/SecurityTab';

const mockSettings = {
  security: {
    lastPasswordChange: '2023-01-01T00:00:00.000Z',
    lastLogin: '2023-01-15T12:30:00.000Z',
    activeSessions: 2,
    loginHistory: [
      {
        device: 'Chrome on Windows',
        location: {
          city: 'New York',
          region: 'NY',
          country: 'USA',
        },
        date: '2023-01-15T12:30:00.000Z',
      },
    ],
  },
};

describe('SecurityTab', () => {
  it('renders login history with location object without crashing', () => {
    render(
      <SecurityTab
        settings={mockSettings}
        setSettings={() => {}}
        loading={false}
        setLoading={() => {}}
        showToast={() => {}}
        loadSettings={() => {}}
      />
    );

    // Check if the location is rendered as a string
    expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
  });
});
