import { Camera, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Trash2, Upload } from 'lucide-react'
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

export function CheckinPanel({ activeTenant, serviceOrderId, mode }: CheckinPanelProps) {
  const [checkin, setCheckin] = useState<Checkin | null>(null)
  const [items, setItems] = useState<CheckinItem[]>([])
  const [photos, setPhotos] = useState<CheckinPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadCheckin() {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch checkin for order
      let { data: existingCheckin, error: checkinError } = await supabase
        .from('checkins')
        .select('*')
        .eq('tenant_id', activeTenant.tenantId)
        .eq('service_order_id', serviceOrderId)
        .maybeSingle()

      if (checkinError) throw new Error(checkinError.message)

      // 2. If no checkin exists, initialize one with default items
      if (!existingCheckin) {
        const { data: newCheckin, error: createError } = await supabase
          .from('checkins')
          .insert({
            tenant_id: activeTenant.tenantId,
            service_order_id: serviceOrderId,
            created_by: activeTenant.userId,
          })
          .select()
          .single()

        if (createError || !newCheckin) throw new Error(createError?.message || 'Falha ao criar check-in')
        existingCheckin = newCheckin

        const initialItems = buildInitialCheckinItems(existingCheckin.id, activeTenant.tenantId)
        const { error: itemsInsertError } = await supabase.from('checkin_items').insert(initialItems)
        if (itemsInsertError) throw new Error(itemsInsertError.message)
      }

      setCheckin(existingCheckin as Checkin)

      // 3. Load checkin items and photos
      const [{ data: loadedItems, error: itemsError }, { data: loadedPhotos, error: photosError }] = await Promise.all([
        supabase
          .from('checkin_items')
          .select('*')
          .eq('tenant_id', activeTenant.tenantId)
          .eq('checkin_id', existingCheckin.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('checkin_photos')
          .select('*')
          .eq('tenant_id', activeTenant.tenantId)
          .eq('checkin_id', existingCheckin.id)
          .order('created_at', { ascending: false }),
      ])

      if (itemsError) throw new Error(itemsError.message)
      if (photosError) throw new Error(photosError.message)

      setItems((loadedItems as CheckinItem[]) || [])
      setPhotos((loadedPhotos as CheckinPhoto[]) || [])
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar check-in')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCheckin()
  }, [activeTenant.tenantId, serviceOrderId])

  async function updateItemStatus(itemId: string, status: CheckinStatus) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status } : item)))
    const { error: updateError } = await supabase
      .from('checkin_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', itemId)

    if (updateError) {
      setError('Falha ao atualizar status do item')
      void loadCheckin()
    }
  }

  async function updateItemNotes(itemId: string, notes: string) {
    const { error: updateError } = await supabase
      .from('checkin_items')
      .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
      .eq('tenant_id', activeTenant.tenantId)
      .eq('id', itemId)

    if (updateError) {
      setError('Falha ao salvar observação')
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>, category: string, itemId?: string) {
    const file = event.target.files?.[0]
    if (!file || !checkin) return

    setUploadingCategory(category)
    setError(null)

    try {
      const photoId = crypto.randomUUID()
      const ext = file.name.split('.').pop() || 'jpg'
      const storagePath = `tenant/${activeTenant.tenantId}/checkins/${checkin.id}/${photoId}.${ext}`

      // 1. Upload to Supabase Storage bucket 'checkin-photos'
      const { error: uploadError } = await supabase.storage
        .from('checkin-photos')
        .upload(storagePath, file, { contentType: file.type, upsert: true })

      if (uploadError) throw new Error(`Erro no upload da imagem: ${uploadError.message}`)

      // 2. Insert metadata into checkin_photos
      const { data: photoRecord, error: dbError } = await supabase
        .from('checkin_photos')
        .insert({
          id: photoId,
          tenant_id: activeTenant.tenantId,
          checkin_id: checkin.id,
          checkin_item_id: itemId || null,
          category,
          storage_path: storagePath,
          content_type: file.type,
          size_bytes: file.size,
          uploaded_by: activeTenant.userId,
        })
        .select()
        .single()

      if (dbError || !photoRecord) {
        // Rollback storage if metadata insert fails
        await supabase.storage.from('checkin-photos').remove([storagePath])
        throw new Error(`Falha ao salvar metadados da foto: ${dbError?.message}`)
      }

      setPhotos((prev) => [photoRecord as CheckinPhoto, ...prev])
    } catch (err: any) {
      setError(err?.message || 'Falha ao enviar foto')
    } finally {
      setUploadingCategory(null)
      event.target.value = ''
    }
  }

  async function handleDeletePhoto(photo: CheckinPhoto) {
    setError(null)
    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('checkin_photos')
        .delete()
        .eq('tenant_id', activeTenant.tenantId)
        .eq('id', photo.id)

      if (dbError) throw new Error(dbError.message)

      // 2. Delete from storage
      await supabase.storage.from('checkin-photos').remove([photo.storage_path])

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err: any) {
      setError(err?.message || 'Falha ao remover foto')
    }
  }

  function getPhotoUrl(storagePath: string) {
    const { data } = supabase.storage.from('checkin-photos').getPublicUrl(storagePath)
    return data.publicUrl
  }

  if (loading) return <p className="status-message">Carregando check-in...</p>

  if (mode === 'photos') {
    return (
      <div className="photos-gallery-tab">
        {error && <p className="error-message" role="alert">{error}</p>}
        {photos.length === 0 ? (
          <p className="empty-state">Nenhuma foto registrada neste check-in.</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-card">
                <img src={getPhotoUrl(photo.storage_path)} alt={photo.caption || photo.category} loading="lazy" />
                <div className="photo-meta">
                  <span>{photo.category}</span>
                  <button type="button" onClick={() => void handleDeletePhoto(photo)} title="Remover foto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="checkin-panel">
      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="checklist-grid">
        {DEFAULT_CHECKIN_ITEMS.map((defaultMeta) => {
          const item = items.find((i) => i.category === defaultMeta.category)
          const itemPhotos = photos.filter((p) => p.category === defaultMeta.category)
          const isUploading = uploadingCategory === defaultMeta.category

          return (
            <div key={defaultMeta.category} className="checkin-card">
              <div className="card-header">
                <h3>{defaultMeta.label}</h3>
                <span className={`status-badge status-${item?.status || 'ok'}`}>{item?.status || 'ok'}</span>
              </div>

              <div className="status-actions">
                <button
                  type="button"
                  className={item?.status === 'ok' ? 'active ok' : ''}
                  onClick={() => item && void updateItemStatus(item.id, 'ok')}
                >
                  <CheckCircle2 size={16} /> OK
                </button>
                <button
                  type="button"
                  className={item?.status === 'attention' ? 'active attention' : ''}
                  onClick={() => item && void updateItemStatus(item.id, 'attention')}
                >
                  <AlertTriangle size={16} /> Atenção
                </button>
                <button
                  type="button"
                  className={item?.status === 'damaged' ? 'active damaged' : ''}
                  onClick={() => item && void updateItemStatus(item.id, 'damaged')}
                >
                  <XCircle size={16} /> Avaria
                </button>
                <button
                  type="button"
                  className={item?.status === 'not_applicable' ? 'active na' : ''}
                  onClick={() => item && void updateItemStatus(item.id, 'not_applicable')}
                >
                  <MinusCircle size={16} /> N/A
                </button>
              </div>

              <div className="card-notes">
                <input
                  type="text"
                  placeholder="Observações..."
                  defaultValue={item?.notes || ''}
                  onBlur={(e) => item && void updateItemNotes(item.id, e.target.value)}
                />
              </div>

              <div className="card-photos">
                <label className="upload-btn">
                  <Camera size={16} /> {isUploading ? 'Enviando...' : 'Adicionar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => void handlePhotoUpload(e, defaultMeta.category, item?.id)}
                  />
                </label>

                {itemPhotos.length > 0 && (
                  <div className="thumb-strip">
                    {itemPhotos.map((photo) => (
                      <div key={photo.id} className="thumb-item">
                        <img src={getPhotoUrl(photo.storage_path)} alt={photo.category} />
                        <button type="button" onClick={() => void handleDeletePhoto(photo)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
