import React from 'react';
import { CheckCircle2, Clock, XCircle, Info, Sparkles, AlertTriangle } from 'lucide-react';

const typeConfig = {
  verified: {
    icon: CheckCircle2,
    defaultLabel: 'Verified',
    style: {
      color: 'var(--color-success)',
      backgroundColor: 'var(--color-success-bg)',
      borderColor: 'var(--color-success-border)',
    },
  },
  approved: {
    icon: CheckCircle2,
    defaultLabel: 'Approved',
    style: {
      color: 'var(--color-success)',
      backgroundColor: 'var(--color-success-bg)',
      borderColor: 'var(--color-success-border)',
    },
  },
  pending: {
    icon: Clock,
    defaultLabel: 'Pending',
    style: {
      color: 'var(--color-warning)',
      backgroundColor: 'var(--color-warning-bg)',
      borderColor: 'var(--color-warning-border)',
    },
  },
  rejected: {
    icon: XCircle,
    defaultLabel: 'Rejected',
    style: {
      color: 'var(--color-danger)',
      backgroundColor: 'var(--color-danger-bg)',
      borderColor: 'var(--color-danger-border)',
    },
  },
  error: {
    icon: AlertTriangle,
    defaultLabel: 'Error',
    style: {
      color: 'var(--color-danger)',
      backgroundColor: 'var(--color-danger-bg)',
      borderColor: 'var(--color-danger-border)',
    },
  },
  featured: {
    icon: Sparkles,
    defaultLabel: 'Featured',
    style: {
      color: 'var(--color-gold)',
      backgroundColor: 'rgba(201, 154, 46, 0.12)',
      borderColor: 'rgba(201, 154, 46, 0.35)',
    },
  },
  info: {
    icon: Info,
    defaultLabel: 'Info',
    style: {
      color: 'var(--color-info)',
      backgroundColor: 'var(--color-info-bg)',
      borderColor: 'var(--color-info-border)',
    },
  },
  neutral: {
    icon: null,
    defaultLabel: '',
    style: {
      color: 'var(--text-secondary)',
      backgroundColor: 'var(--bg-card-subtle)',
      borderColor: 'var(--border-subtle)',
    },
  },
};

export const Badge = ({
  type = 'neutral',
  label,
  children,
  icon: CustomIcon,
  size = 'md',
  className = '',
  dot = false,
}) => {
  const config = typeConfig[type] || typeConfig.neutral;
  const Icon = CustomIcon !== undefined ? CustomIcon : config.icon;
  const text = label || children || config.defaultLabel;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border transition-colors select-none tracking-wide ${sizeClasses} ${className}`}
      style={config.style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.style.color }}
        />
      )}
      {!dot && Icon && (
        <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      )}
      {text && <span>{text}</span>}
    </span>
  );
};

export default Badge;
