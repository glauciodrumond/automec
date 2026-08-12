import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, MessageSquare, Car, Package } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { getCRMOpportunities, getInventory, getWorkstations } from '../services/autoosService'
import type { ActiveTenantContext } from '../lib/tenant'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function AIWorkshopCopilot({ activeTenant }: { activeTenant: ActiveTenantContext }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Olá! Sou o **AUTOOS Copilot**, o assistente inteligente da oficina **${activeTenant.tenantName}**. Como posso ajudar na gestão da sua oficina hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)

  async function handleAskQuestion(userQuery: string) {
    if (!userQuery.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    try {
      let aiResponseText = ''
      const queryLower = userQuery.toLowerCase()

      if (queryLower.includes('estoque') || queryLower.includes('peça') || queryLower.includes('mínimo')) {
        const inventory = await getInventory(activeTenant.tenantId)
        const lowStock = inventory.filter((p) => p.stock_current <= (p.stock_min || 5))

        if (lowStock.length === 0) {
          aiResponseText = '✅ **Análise de Estoque:** Todas as peças e produtos estão acima do estoque mínimo!'
        } else {
          aiResponseText = `⚠️ **Alerta de Estoque Baixo (${lowStock.length} itens):**\n\n` +
            lowStock.map((p) => `- **${p.name}**: ${p.stock_current} unidades em estoque (Mínimo: ${p.stock_min || 5})`).join('\n')
        }
      } else if (queryLower.includes('oportunidade') || queryLower.includes('receita') || queryLower.includes('orçamento') || queryLower.includes('reativação')) {
        const crmData = await getCRMOpportunities(activeTenant.tenantId)
        const total = crmData.pendingQuotesTotal + crmData.inactiveClientsTotal

        aiResponseText = `📈 **Resumo de Oportunidades de Receita:**\n\n` +
          `- **Orçamentos Pendentes:** ${crmData.pendingQuotes.length} orçamento(s) no valor de **${formatCurrency(crmData.pendingQuotesTotal)}**\n` +
          `- **Clientes Inativos (>180 dias):** ${crmData.inactiveClients.length} cliente(s) com potencial de **${formatCurrency(crmData.inactiveClientsTotal)}**\n` +
          `💰 **Potencial Total de Recuperação:** **${formatCurrency(total)}**`
      } else if (queryLower.includes('elevador') || queryLower.includes('box') || queryLower.includes('oficina')) {
        const stations = await getWorkstations(activeTenant.tenantId)
        const occupied = stations.filter((s) => s.status === 'occupied').length
        const available = stations.filter((s) => s.status === 'available').length

        aiResponseText = `🏗️ **Capacidade da Oficina (Elevadores & Boxes):**\n\n` +
          `- **Disponíveis para Atendimento:** ${available}\n` +
          `- **Ocupados no Momento:** ${occupied}\n` +
          `- **Total de Equipamentos:** ${stations.length}`
      } else {
        aiResponseText = `💡 **AUTOOS IA:** Para a oficina **${activeTenant.tenantName}**, analisei sua consulta ("${userQuery}"). Recomendo verificar os módulos de **Oportunidades & CRM** ou **Estoque & Peças** no menu lateral para obter dados operacionais completos!`
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'Ops! Ocorreu um erro ao processar sua consulta com o Copilot.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  return (
    <section className="screen-section full-widescreen" style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Assistente Inteligente AUTOOS</p>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={32} style={{ color: '#2563eb' }} />
            Copiloto IA da Oficina
          </h1>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          className="secondary-btn btn-sm"
          style={{ background: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => void handleAskQuestion('Quais peças estão com estoque baixo?')}
        >
          <Package size={14} style={{ color: '#f59e0b' }} /> Estoque mínimo de peças
        </button>

        <button
          type="button"
          className="secondary-btn btn-sm"
          style={{ background: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => void handleAskQuestion('Quais são as oportunidades de receita pendentes?')}
        >
          <TrendingUp size={14} style={{ color: '#10b981' }} /> Oportunidades & CRM
        </button>

        <button
          type="button"
          className="secondary-btn btn-sm"
          style={{ background: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => void handleAskQuestion('Qual o status dos elevadores e boxes?')}
        >
          <Car size={14} style={{ color: '#2563eb' }} /> Status dos Elevadores
        </button>
      </div>

      {/* Chat Messages Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 440, paddingRight: 6 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: m.sender === 'user' ? '#2563eb' : '#f8fafc',
                color: m.sender === 'user' ? '#fff' : '#0f172a',
                padding: '12px 16px',
                borderRadius: 12,
                border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                fontSize: '0.92rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
              <small style={{ display: 'block', fontSize: '0.7rem', marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                {m.timestamp}
              </small>
            </div>
          ))}

          {thinking && (
            <div style={{ alignSelf: 'flex-start', background: '#f8fafc', padding: '10px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.88rem', color: '#64748b' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: 6, animation: 'spin 1s linear infinite' }} />
              Analisando dados da oficina...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); void handleAskQuestion(input) }} style={{ display: 'flex', gap: 10, marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Copiloto IA sobre estoque, orçamentos, veículos ou elevadores..."
            style={{ flex: 1, borderRadius: 8, border: '1px solid #cbd5e1', padding: '10px 14px' }}
          />
          <button type="submit" className="primary-btn" disabled={thinking || !input.trim()}>
            <Send size={16} /> Enviar
          </button>
        </form>
      </div>
    </section>
  )
}
