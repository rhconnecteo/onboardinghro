import { render, screen } from '@testing-library/react';
import App from './App';

test('renders onboarding app title', () => {
  render(<App />);
  const title = screen.getByText(/onboarding hro/i);
  expect(title).toBeInTheDocument();
});
