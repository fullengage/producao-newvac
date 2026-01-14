import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  ShoppingCart,
  Factory,
  Settings,
  AlertTriangle,
  TrendingUp,
  LogOut,
  ChevronRight,
} from 'lucide-react'

const sections = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Análise Clientes', href: '/analise-clientes', icon: TrendingUp },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Usuários', href: '/usuarios', icon: UserCircle },
      { name: 'Produtos', href: '/produtos', icon: Package },
    ],
  },
  {
    title: 'Operacional',
    items: [
      { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
      { name: 'OPs (Kanban)', href: '/ops', icon: Factory },
      { name: 'Apontamento Extrusão', href: '/apontamento-extrusao', icon: TrendingUp },
      { name: 'Aparas', href: '/aparas', icon: AlertTriangle },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-slate-900 text-slate-300 lg:block">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-20 items-center px-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-900/20">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">NewVac BI</h1>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-widest">Analytics</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                        'group-hover:text-red-400 isActive:text-white'
                      )} />
                      {item.name}
                    </div>
                    <ChevronRight className={cn(
                      'h-4 w-4 opacity-0 transition-all duration-200 -translate-x-2',
                      'group-hover:opacity-100 group-hover:translate-x-0'
                    )} />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 p-4 space-y-1">
          <NavLink
            to="/config"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Settings className="h-5 w-5" />
            Configurações
          </NavLink>

          <button
            onClick={() => {/* Implement logout logic */ }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Sair do Sistema
          </button>
        </div>
      </div>
    </aside>
  )
}
