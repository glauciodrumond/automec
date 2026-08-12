import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AIWorkshopCopilot } from './components/AIWorkshopCopilot'
import { AuthGate } from './components/AuthGate'
import { ChecklistConfig } from './components/ChecklistConfig'
import { CommissionsPanel } from './components/CommissionsPanel'
import { CRMOportunidades } from './components/CRMOportunidades'
import { CustomerCRM } from './components/CustomerCRM'
import { CustomerPortal } from './components/CustomerPortal'
import { Dashboard } from './components/Dashboard'
import { FinancialDRE } from './components/FinancialDRE'
import { KanbanBoard } from './components/KanbanBoard'
import { Layout } from './components/Layout'
import { MechanicPortal } from './components/MechanicPortal'
import { NewServiceOrder } from './components/NewServiceOrder'
import { ProductsList } from './components/ProductsList'
import { PurchaseOrders } from './components/PurchaseOrders'
import { ServiceOrderDetail } from './components/ServiceOrderDetail'
import { ServiceOrderList } from './components/ServiceOrderList'
import { ServiceSchedule } from './components/ServiceSchedule'
import { TeamMembers } from './components/TeamMembers'
import { VehiclePassport } from './components/VehiclePassport'
import { WorkStationPanel } from './components/WorkStationPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public customer portal — no auth required */}
        <Route path="/portal/:token" element={<CustomerPortal />} />

        {/* Protected app routes */}
        <Route
          path="/*"
          element={
            <AuthGate>
              {(activeTenant) => (
                <Layout activeTenant={activeTenant}>
                  <Routes>
                    <Route path="/" element={<Dashboard activeTenant={activeTenant} />} />
                    <Route path="/kanban" element={<KanbanBoard activeTenant={activeTenant} />} />
                    <Route path="/orders" element={<ServiceOrderList activeTenant={activeTenant} />} />
                    <Route path="/orders/new" element={<NewServiceOrder activeTenant={activeTenant} />} />
                    <Route path="/orders/:id" element={<ServiceOrderDetail activeTenant={activeTenant} />} />
                    <Route path="/mechanic" element={<MechanicPortal activeTenant={activeTenant} />} />
                    <Route path="/vehicles/:plate/passport" element={<VehiclePassport activeTenant={activeTenant} />} />
                    <Route path="/schedule" element={<ServiceSchedule activeTenant={activeTenant} />} />
                    <Route path="/products" element={<ProductsList activeTenant={activeTenant} />} />
                    <Route path="/customers" element={<CustomerCRM activeTenant={activeTenant} />} />
                    <Route path="/crm-opportunities" element={<CRMOportunidades activeTenant={activeTenant} />} />
                    <Route path="/financial" element={<FinancialDRE activeTenant={activeTenant} />} />
                    <Route path="/commissions" element={<CommissionsPanel activeTenant={activeTenant} />} />
                    <Route path="/team" element={<TeamMembers activeTenant={activeTenant} />} />
                    <Route path="/workstations" element={<WorkStationPanel activeTenant={activeTenant} />} />
                    <Route path="/checklist-config" element={<ChecklistConfig activeTenant={activeTenant} />} />
                    <Route path="/purchases" element={<PurchaseOrders activeTenant={activeTenant} />} />
                    <Route path="/copilot" element={<AIWorkshopCopilot activeTenant={activeTenant} />} />
                  </Routes>
                </Layout>
              )}
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
