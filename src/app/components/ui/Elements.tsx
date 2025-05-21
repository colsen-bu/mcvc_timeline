'use client';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  icon,
}: ButtonProps) => {
  // Base classes
  let buttonClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  // Size classes
  switch (size) {
    case 'sm':
      buttonClasses += ' px-2.5 py-1.5 text-xs';
      break;
    case 'lg':
      buttonClasses += ' px-6 py-3 text-base';
      break;
    default:
      buttonClasses += ' px-4 py-2 text-sm';
      break;
  }
  
  // Variant classes
  switch (variant) {
    case 'primary':
      buttonClasses += ' bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500';
      if (disabled) {
        buttonClasses += ' bg-blue-300 cursor-not-allowed hover:bg-blue-300';
      }
      break;
    case 'secondary':
      buttonClasses += ' bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500';
      if (disabled) {
        buttonClasses += ' bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100';
      }
      break;
    case 'outline':
      buttonClasses += ' bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500';
      if (disabled) {
        buttonClasses += ' text-gray-300 cursor-not-allowed hover:bg-transparent';
      }
      break;
    case 'danger':
      buttonClasses += ' bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500';
      if (disabled) {
        buttonClasses += ' bg-red-300 cursor-not-allowed hover:bg-red-300';
      }
      break;
  }
  
  return (
    <button
      type={type}
      className={`${buttonClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
};

interface InputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

export const Input = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  required = false,
}: InputProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
        required={required}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface TextareaProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  className?: string;
  required?: boolean;
  rows?: number;
}

export const Textarea = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  className = '',
  required = false,
  rows = 3,
}: TextareaProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
        required={required}
        rows={rows}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export const Badge = ({ children, color = 'blue', className = '' }: BadgeProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {children}
    </span>
  );
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed border-gray-200 my-4">
      <svg
        className="w-12 h-12 text-gray-500 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0h10"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-700 max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
