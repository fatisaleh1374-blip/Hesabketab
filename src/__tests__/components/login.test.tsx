
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Firebase services
jest.mock('@/firebase', () => ({
  useAuth: () => ({}),
  useFirestore: () => ({}),
  useUser: () => ({ user: null, isUserLoading: false }),
}));

// Mock 'firebase/auth' module
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('LoginPage', () => {

    beforeEach(() => {
        mockPush.mockClear();
        mockToast.mockClear();
        (signInWithEmailAndPassword as jest.Mock).mockClear();
    });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/ایمیل/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/رمز عبور/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ورود/i })).toBeInTheDocument();
  });

  it('shows validation error for unauthorized email', async () => {
    render(<LoginPage />);
    fireEvent.input(screen.getByLabelText(/ایمیل/i), {
      target: { value: 'test@wrong.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

    await waitFor(() => {
        expect(screen.getByText('شما اجازه ورود به این اپلیکیشن را ندارید.')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: '123', email: 'ali@khanevadati.app' },
    });

    render(<LoginPage />);

    fireEvent.input(screen.getByLabelText(/ایمیل/i), {
      target: { value: 'ali@khanevadati.app' },
    });
    fireEvent.input(screen.getByLabelText(/رمز عبور/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'ورود موفق',
        }));
    });
  });

  it('handles wrong password error', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/wrong-password',
    });

    render(<LoginPage />);

    fireEvent.input(screen.getByLabelText(/ایمیل/i), {
      target: { value: 'ali@khanevadati.app' },
    });
    fireEvent.input(screen.getByLabelText(/رمز عبور/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'خطا در ورود',
        description: 'ایمیل یا رمز عبور اشتباه است.',
      }));
    });
  });

  it('handles user-not-found error with the same generic message', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/user-not-found',
    });

    render(<LoginPage />);

    fireEvent.input(screen.getByLabelText(/ایمیل/i), {
      target: { value: 'anotheruser@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/رمز عبور/i), {
      target: { value: 'somepassword' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'خطا در ورود',
        description: 'ایمیل یا رمز عبور اشتباه است.',
      }));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
