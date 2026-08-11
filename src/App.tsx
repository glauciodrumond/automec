import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { Layout } from './components/Layout'
import { TeamMembers } from './components/TeamMembers'

function OrdersPanel() {
  return <section className="screen-section"><div className="screen-heading"><div><p className="eyebrow">Operacao</p><h1>Ordens de servico</h1></div><Link className="primary-link" to="/orders/new">Nova OS</Link></div><p className="empty-state">As ordens de servico aparecerao aqui.</p></section>
}

function NewOrderPanel() {
  return <section className="screen-section"><div className="screen-heading"><div><p className="eyebrow">Operacao</p><h1>Nova ordem de servico</h1></div><Link className="secondary-link" to="/">Voltar</Link></div><p className="empty-state">O cadastro de OS sera disponibilizado no proximo passo.</p></section>
}

function OrderDetailPanel() {
  const { id } = useParams()
  return <section className="screen-section"><div className="screen-heading"><div><p className="eyebrow">Ordem de servico</p><h1>OS {id}</h1></div><Link className="secondary-link" to="/">Voltar</Link></div><p className="empty-state">Os detalhes da OS serao disponibilizados no proximo passo.</p></section>
}

function App() {
  return <BrowserRouter><AuthGate>{(activeTenant) => <Layout activeTenant={activeTenant}><Routes><Route path="/" element={<OrdersPanel />} /><Route path="/orders/new" element={<NewOrderPanel />} /><Route path="/orders/:id" element={<OrderDetailPanel />} /><Route path="/team" element={<TeamMembers activeTenant={activeTenant} />} /></Routes></Layout>}</AuthGate></BrowserRouter>
}

export default App
