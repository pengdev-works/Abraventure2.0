import React, { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

export const AlertProvider = ({ children }) => {
  const showAlert = useCallback((message, type = 'info', duration = 4000) => {
    const options = {
      duration: duration,
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(15, 61, 62, 0.08)',
        fontSize: '13px',
        fontWeight: '600',
        color: '#0F3D3E',
        padding: '12px 18px',
        boxShadow: '0 10px 25px -5px rgba(15, 61, 62, 0.1), 0 8px 10px -6px rgba(15, 61, 62, 0.05)',
      },
    };

    switch (type) {
      case 'success':
        toast.success(message, {
          ...options,
          iconTheme: {
            primary: '#0F3D3E',
            secondary: '#fff',
          },
          style: {
            ...options.style,
            borderLeft: '4px solid #0F3D3E',
          }
        });
        break;
      case 'error':
        toast.error(message, {
          ...options,
          iconTheme: {
            primary: '#e11d48',
            secondary: '#fff',
          },
          style: {
            ...options.style,
            borderLeft: '4px solid #e11d48',
          }
        });
        break;
      case 'warning':
        toast(message, {
          ...options,
          icon: '⚠️',
          style: {
            ...options.style,
            borderLeft: '4px solid #d97706',
          }
        });
        break;
      default:
        toast.className = 'info-toast';
        toast(message, {
          ...options,
          iconTheme: {
            primary: '#0284c7',
            secondary: '#fff',
          },
          style: {
            ...options.style,
            borderLeft: '4px solid #0284c7',
          }
        });
    }
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Toaster position="top-right" reverseOrder={false} />
    </AlertContext.Provider>
  );
};
