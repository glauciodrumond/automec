import { Search, UserCheck, Car, ClipboardList, Package, ArrowRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchGlobalEntities, type GlobalSearchResult } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'

export function UniversalSearch({
  activeTenant,
  isOpen,
  onClose,
}: {
  activeTenant: ActiveTenantContext
  isOpen: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open handled externally
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      void searchGlobalEntities(activeTenant.tenantId, query)
        .then((res) => {
          setResults(res)
          setSelectedIndex(0)
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [query, activeTenant.tenantId])

  if (!isOpen) return null

  function handleSelect(item: GlobalSearchResult) {
    onClose()
    setQuery('')
    navigate(item.link)
  }

  function getIcon(type: GlobalSearchResult['type']) {
    switch (type) {
      case 'customer':
        return <UserCheck size={18} style={{ color: '#2563eb' }} />
      case 'vehicle':
        return <Car size={18} style={{ color: '#10b981' }} />
      case 'service_order':
        return <ClipboardList size={18} style={{ color: '#7c3aed' }} />
      case 'product':
        return <Package size={18} style={{ color: '#f59e0b' }} />
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
      <div
        className="modal-card wide"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}
      >
        {/* Search Header */}
        <div className="search-bar" style={{ borderRadius: 0, border: 0, borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <Search size={22} style={{ color: '#2563eb' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca Universal (Ctrl + K) — Digite cliente, placa, OS #, produto..."
            style={{ fontSize: '1rem', fontWeight: 600 }}
          />
          <button type="button" onClick={onClose} style={{ border: 0, background: 'transparent', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && <p className="status-message">Buscando em todo o sistema...</p>}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="empty-state">Nenhum resultado encontrado para "{query}".</p>
          )}

          {!loading && query.length < 2 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Dica de Busca Rápida</p>
              <small>Digite pelo menos 2 caracteres para buscar Clientes, Placas de Veículos, Códigos de OS ou Peças.</small>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: index === selectedIndex ? '#eff6ff' : '#fff',
                    border: '1px solid',
                    borderColor: index === selectedIndex ? '#bfdbfe' : '#f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, display: 'grid', placeItems: 'center' }}>
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>{item.title}</strong>
                      <small style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.subtitle}</small>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: '#2563eb' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>

          <span>Pressione <strong>ESC</strong> para fechar</span>
          <span>Navegue com os resultados em tempo real</span>
        </div>
      </div>
    </div>
  )
}
