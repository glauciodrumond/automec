import { Camera, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Trash2, Upload, Eye, ShieldAlert, Car } from 'lucide-react'
import { ChangeEvent, useEffect, useState } from 'react'
import { buildInitialCheckinItems, DEFAULT_CHECKIN_ITEMS } from '../lib/checkin'
import { supabase } from '../lib/supabase'
import type { ActiveTenantContext } from '../lib/tenant'
import type { Checkin, CheckinItem, CheckinPhoto, CheckinStatus } from '../types/database'

interface CheckinPanelProps {
  activeTenant: ActiveTenantContext
  serviceOrderId: string
  mode: 'checkin' | 'photos'
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  front: { label: 'Frente do Veículo', icon: '🚘' },
  rear: { label: 'Traseira do Veículo', icon: '🚙' },
  left_side: { label: 'Lateral Esquerda', icon: '🚪' },
  right_side: { label: 'Lateral Direita', icon: '🚪' },
  interior: { label: 'Interior & Estofamento', icon: '💺' },
  dashboard: { label: 'Painel & Odômetro', icon: '🎛️' },
  damage: { label: 'Avarias / Danos Pré-existentes', icon: '⚠️' },
  documents_objects: { label: 'Objetos & Documentos', icon: '📋' },
  extra: { label: 'Outros Itens', icon: '🔍' },
}

const STATUS_CONFIG: Record<CheckinStatus, { label: string; color: string; bg: string }> = {
  ok: { label: 'OK', color: '#10b981', bg: '#ecfdf5' },
  attention: { label: 'Atenção', color: '#f59e0b', bg: '#fffbeb' },
  damaged: { label: 'Danificado', color: '#ef4444', bg: '#fef2f2' },
  not_applicable: { label: 'N/A', color: '#64748b', bg: '#f1f5f9' },
}

export function CheckinPanel({ activeTenant, serviceOrderId, mode }: CheckinPanelProps) {
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [items, setItems] = useState<CheckinItem[]>([])
  const [photos, setPhotos] = useState<CheckinPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadCheckin() {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch existing checkin safely with maybeSingle
      let { data: existingCheckin } = await supabase
        .from('checkins')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('service_order_id', serviceOrderId)
        .maybeSingle()

      // 2. If no checkin exists, create safely using upsert
      if (!existingCheckin) {
        const { data: newCheckin, error: createError } = await supabase
          .from('checkins')
          .upsert(
            {
              tenant_id: activeTenant.tenantId,
              service_order_id: serviceOrderId,
              created_by: activeTenant.userId,
            },
            { onConflict: 'tenant_id, service_order_id' }
          )
          .select()
          .single()

        if (createError || !newCheckin) {
          // Retry select in case of race condition
          const { data: retryCheckin } = await supabase
            .from('checkins')
            .select('*')
            .eq('tenant_id', activeTenant.tenantId)
            .eq('service_order_id', serviceOrderId)
            .maybeSingle()

          if (!retryCheckin) throw new Error('Não foi possível inicializar o check-in')
          existingCheckin = retryCheckin
        } else {
          existingCheckin = newCheckin
        }

        const initialItems = buildInitialCheckinItems(existingCheckin.id, activeTenant.tenantId)
        await supabase.from('checkin_items').insert(initialItems)
      }

      setCheckin(existingCheckin as Checkin)

      // 3. Load items and photos
      const [{ data: loadedItems }, { data: loadedPhotos }] = await Promise.all([
        supabase
          .from('checkin_items')
          .select('*')
          .eq('tenant_id', activeTenant.tenantId)
          .eq('checkin_id', existingCheckin.id)
          .order('sort_order'),
        supabase
          .from('checkin_photos')
          .select('*')
          .eq('tenant_id', activeTenant.tenantId)
          .eq('checkin_id', existingCheckin.id)
          .order('sort_order'),
      ])

      setItems((loadedItems as CheckinItem[]) || [])
      setPhotos((loadedPhotos as CheckinPhoto[]) || [])
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados do check-in')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCheckin()
  }, [activeTenant.tenantId, serviceOrderId])

  async function updateItemStatus(itemId: string, status: CheckinStatus) {
    // Optimistic update
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status } : item)))

    await supabase
      .from('checkin_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', itemId)
  }

  async function updateItemNotes(itemId: string, notes: string) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, notes } : item)))

    await supabase
      .from('checkin_items')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', itemId)
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>, category: string) {
    const files = e.target.files
    if (!files || files.length === 0 || !checkin) return

    setUploadingCategory(category)
    setError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const photoId = crypto.randomUUID()
        const ext = file.name.split('.').pop() || 'jpg'
        const storagePath = `tenant/${activeTenant.tenantId}/checkins/${checkin.id}/${photoId}.${ext}`

        // Upload to storage bucket
        const { error: uploadError } = await supabase.storage.from('tenant-files').upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        })

        if (uploadError) throw uploadError

        // Save record in checkin_photos
        const { data: photoRecord, error: dbError } = await supabase
          .from('checkin_photos')
          .insert({
            id: photoId,
            tenant_id: activeTenant.tenantId,
            checkin_id: checkin.id,
            category: category as any,
            storage_path: storagePath,
            content_type: file.type,
            size_bytes: file.size,
            uploaded_by: activeTenant.userId,
          })
          .select()
          .single()

        if (dbError) throw dbError
        if (photoRecord) {
          setPhotos((prev) => [...prev, photoRecord as CheckinPhoto])
        }
      }
    } catch (err: any) {
      setError('Falha ao enviar foto: ' + (err?.message || 'erro de rede'))
    } finally {
      setUploadingCategory(null)
    }
  }

  async function handleDeletePhoto(photoId: string, storagePath: string) {
    if (!confirm('Deseja remover esta foto do check-in?')) return

    await supabase.storage.from('tenant-files').remove([storagePath])
    await supabase.from('checkin_photos').delete().eq('tenant_id', activeTenant.tenantId).eq('id', photoId)

    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  function getPublicUrl(storagePath: string) {
    const { data } = supabase.storage.from('tenant-files').getPublicUrl(storagePath)
    return data.publicUrl
  }

  if (loading) return <p className="status-message">Carregando formulário de check-in...</p>
  if (error) return <p className="error-message">{error}</p>

  // Group items by category
  const categories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="checkin-container">
      {/* Overview Stats Bar */}
      <div className="checkin-summary-bar">
        <div className="summary-stat ok">
          <strong>{items.filter((i) => i.status === 'ok').length}</strong>
          <span>Itens OK</span>
        </div>
        <div className="summary-stat attention">
          <strong>{items.filter((i) => i.status === 'attention').length}</strong>
          <span>Em Atenção</span>
        </div>
        <div className="summary-stat damaged">
          <strong>{items.filter((i) => i.status === 'damaged').length}</strong>
          <span>Avariados</span>
        </div>
        <div className="summary-stat photos">
          <strong>{photos.length}</strong>
          <span>Fotos Anexadas</span>
        </div>
      </div>

      {mode === 'checkin' ? (
        /* Checkin Inspection Grid */
        <div className="checkin-categories-grid">
          {categories.map((catKey) => {
            const catInfo = CATEGORY_LABELS[catKey] || { label: catKey, icon: '📋' }
            const catItems = items.filter((i) => i.category === catKey)
            const catPhotos = photos.filter((p) => p.category === catKey)

            return (
              <div key={catKey} className="checkin-card-category">
                <div className="category-header">
                  <h3>
                    <span>{catInfo.icon}</span> {catInfo.label}
                  </h3>
                  <span className="category-photo-badge">
                    <Camera size={14} /> {catPhotos.length} foto(s)
                  </span>
                </div>

                <div className="category-items-list">
                  {catItems.map((item) => {
                    const defaultDef = DEFAULT_CHECKIN_ITEMS.find((d) => d.category === item.category)
                    const label = defaultDef ? defaultDef.label : catInfo.label

                    return (
                      <div key={item.id} className="checkin-item-row">
                        <div className="item-label-container">
                          <strong>{label}</strong>
                          {item.notes && <span className="item-notes-preview">💬 {item.notes}</span>}
                        </div>

                        {/* Status Selectors */}
                        <div className="status-selector-group">
                          {(['ok', 'attention', 'damaged', 'not_applicable'] as CheckinStatus[]).map((st) => {
                            const isSelected = item.status === st
                            const cfg = STATUS_CONFIG[st]

                            return (
                              <button
                                key={st}
                                type="button"
                                className={`status-pill ${isSelected ? 'active' : ''}`}
                                style={
                                  isSelected
                                    ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
                                    : {}
                                }
                                onClick={() => void updateItemStatus(item.id, st)}
                              >
                                {cfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Photos Upload & Gallery Mode */
        <div className="checkin-photos-gallery">
          <h2>📷 Galeria de Fotos do Check-in ({photos.length})</h2>

          <div className="photo-sections-grid">
            {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
              const catPhotos = photos.filter((p) => p.category === catKey)

              return (
                <div key={catKey} className="photo-category-block">
                  <div className="photo-category-header">
                    <span>{catInfo.icon} {catInfo.label}</span>
                    <label className="upload-btn-label">
                      <Upload size={14} /> Anexar Fotos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => void handlePhotoUpload(e, catKey)}
                      />
                    </label>
                  </div>

                  {uploadingCategory === catKey && (
                    <p className="status-message">Enviando imagem...</p>
                  )}

                  {catPhotos.length === 0 ? (
                    <p className="photo-empty-slot">Nenhuma foto enviada nesta seção.</p>
                  ) : (
                    <div className="photo-thumbnails-grid">
                      {catPhotos.map((photo) => {
                        const imgUrl = getPublicUrl(photo.storage_path)

                        return (
                          <div key={photo.id} className="photo-thumb-card">
                            <img src={imgUrl} alt={photo.caption || 'Foto do Check-in'} />
                            <div className="photo-thumb-actions">
                              <button
                                type="button"
                                className="thumb-action-btn view"
                                title="Ver em tela cheia"
                                onClick={() => setPreviewPhotoUrl(imgUrl)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="thumb-action-btn delete"
                                title="Excluir foto"
                                onClick={() => void handleDeletePhoto(photo.id, photo.storage_path)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Zoom de Foto */}
      {previewPhotoUrl && (
        <div className="modal-overlay" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="modal-card wide" style={{ textAlign: 'center', background: '#0f172a', padding: 16 }}>
            <img
              src={previewPhotoUrl}
              alt="Visualização"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }}
            />
            <div style={{ marginTop: 12 }}>
              <button type="button" className="primary-btn" onClick={() => setPreviewPhotoUrl(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
