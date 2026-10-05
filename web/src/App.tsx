import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemeSync } from './components/ThemeSync'
import { hasSession } from './api/client'
import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { AddVehiclePage } from './pages/AddVehiclePage'
import { FuelLevelPage } from './pages/FuelLevelPage'
import { EditFuelLevelPage } from './pages/EditFuelLevelPage'
import { AddFuelPage } from './pages/AddFuelPage'
import { FuelTransactionPage } from './pages/FuelTransactionPage'
import { PlanTripPage } from './pages/PlanTripPage'
import { TripResultPage } from './pages/TripResultPage'
import { NavigationPage } from './pages/NavigationPage'
import { FuelStationsPage } from './pages/FuelStationsPage'
import { TripConfirmPage } from './pages/TripConfirmPage'
import { ActiveTripPage } from './pages/ActiveTripPage'
import { TripSummaryPage } from './pages/TripSummaryPage'
import { HistoryPage } from './pages/HistoryPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { MorePage } from './pages/MorePage'
import { MapHomePage } from './pages/MapHomePage'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!hasSession()) {
    return <Navigate to="/auth?mode=login" replace />
  }
  return children
}

export default function App() {
  return (
    <>
      <ThemeSync />
      <Routes>
      <Route path="/" element={<OnboardingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/add" element={<AddVehiclePage />} />
        <Route path="fuel/level" element={<FuelLevelPage />} />
        <Route path="fuel/level/edit" element={<EditFuelLevelPage />} />
        <Route path="fuel/add" element={<AddFuelPage />} />
        <Route path="fuel/transactions/:id" element={<FuelTransactionPage />} />
        <Route path="plan" element={<PlanTripPage />} />
        <Route path="trip-result" element={<TripResultPage />} />
        <Route path="trip-confirm" element={<TripConfirmPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="active-trip" element={<ActiveTripPage />} />
        <Route path="trip-summary" element={<TripSummaryPage />} />
        <Route path="stations" element={<FuelStationsPage />} />
        <Route path="map" element={<MapHomePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:id" element={<TripDetailPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="more" element={<MorePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
