import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      },
    }),
  ],
  theme: {
    colors: {
      primary: '#4f46e5',
      'primary-hover': '#4338ca',
      secondary: '#f8fafc',
      'text-primary': '#1e293b',
      'text-secondary': '#64748b',
      'border-color': '#e2e8f0',
      'border-hover': '#cbd5e1',
      success: '#10b981',
      'success-hover': '#059669',
      danger: '#ef4444',
      'danger-hover': '#dc2626',
      warning: '#f59e0b',
      'warning-hover': '#d97706',
    },
    borderRadius: {
      'sm': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
    },
    boxShadow: {
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
  },
  shortcuts: {
    'btn': 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer border-none',
    'btn-primary': 'btn bg-primary text-white hover:bg-primary-hover',
    'btn-success': 'btn bg-success text-white hover:bg-success-hover',
    'btn-danger': 'btn bg-danger text-white hover:bg-danger-hover',
    'btn-warning': 'btn bg-warning text-white hover:bg-warning-hover',
    'btn-secondary': 'btn bg-gray-100 text-gray-700 hover:bg-gray-200',
    'form-input': 'w-full px-3 py-2 border border-border-color rounded-md text-sm transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgb(79_70_229_/_0.1)]',
    'card': 'bg-white rounded-lg shadow-md border border-border-color',
    'card-header': 'px-6 py-4 border-b border-border-color',
    'card-body': 'p-6',
  },
  safelist: [
    // 确保常用的类不被清除
    'transition-all',
    'duration-200',
    'ease-in-out',
    'hover:scale-105',
    'active:scale-95',
  ],
})