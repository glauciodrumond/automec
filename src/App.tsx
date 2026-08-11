import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthGate } from './components/AuthGate'
import { Layout } from './components/Layout'
import { NewServiceOrder } from './components/NewServiceOrder'
import { ServiceOrderDetail } from './components/ServiceOrderDetail'
import { ServiceOrderList } from './components/ServiceOrderList'
import { TeamMembers } from './components/TeamMembers'

function App() {
  return <BrowserRouter><AuthGate>{(activeTenant) => <Layout activeTenant={activeTenant}><Routes><Route path="/" element={<ServiceOrderList activeTenant={activeTenant} />} /><Route path="/orders/new" element={<NewServiceOrder activeTenant={activeTenant} />} /><Route path="/orders/:id" element={<ServiceOrderDetail activeTenant={activeTenant} />} /><Route path="/team" element={<TeamMembers activeTenant={activeTenant} />} /></Routes></Layout>}</AuthGate></BrowserRouter>
}

export default App
