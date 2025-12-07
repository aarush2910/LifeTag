import { Route, Routes } from "react-router-dom"
import ErrorBoundary from "./components/ErrorBoundary"
import ScrollToTop from "./components/ScrollToTop"
import Home from "./Page/Home"
import Signup from "./Page/Signup"
import Login from "./Page/Login"
import Forget from "./Page/Forget"
import Contact from "./Page/Contact"
import Farmer_Dashboard from "./Page/Dashboard/Farmer_Dashboard"
import Vet_Dashboard from "./Page/Dashboard/Vet_Dashboard"
import { ProtectedRoute, PublicOnlyRoute } from "./components/route-guards"
import Account_info from "./Page/Logics/Account_info"
import Dialog from "./Page/Dialog"
import InaphPage from "./Page/InaphPage"
import InaphLogin from "./Page/InaphLogin"
import Add_new_cattle from "./Page/Logics/Add_new_cattle"
import View_cattle_list from "./Page/Logics/View_cattle_list"
import Appointment_info from "./Page/Logics/Appointment_info"
import Request_vet from "./Page/Logics/Request_vet"
import Ownership_transfer from "./Page/Logics/Ownership_transfer"
import Retirement_request from "./Page/Logics/Retirement_request"
import Shelter_Dashboard from "./Page/Dashboard/Shelter_Dashboard"
import VetLogin from "./Page/VetLogin"
import VetCreatePassword from "./Page/VetCreatePassword"
import ShelterLogin from "./Page/ShelterLogin"
import ShelterSignup from "./Page/ShelterSignup"



const App = () => {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/InaphPage" element={<InaphPage />} />
          <Route path="/InaphLogin" element={<InaphLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forget" element={<Forget />} />
          <Route path="/dialog" element={<Dialog />} />
        </Route>
        <Route path="/Contact" element={<Contact />} />
        <Route path="/vet_dashboard" element={<Vet_Dashboard/>} />
        <Route path="/vet_dashboard/:nested" element={<Vet_Dashboard/>} />
        <Route path="/shelter_dashboard" element={<Shelter_Dashboard/>} />
        <Route path="/shelter_dashboard/:nested" element={<Shelter_Dashboard/>} />
        <Route path="/vet/login" element={<VetLogin />} />
      <Route path="/vet/create-password" element={<VetCreatePassword />} />
      <Route path="/shelter/login" element={<ShelterLogin />} />
        <Route path="/shelter/signup" element={<ShelterSignup />} />

        <Route element={<ProtectedRoute />}>
        <Route path="/vet_dashboard" element={<Vet_Dashboard/>} />
        <Route path="/vet_dashboard/:nested" element={<Vet_Dashboard/>} />
        <Route path="/shelter_dashboard" element={<Shelter_Dashboard/>} />
        <Route path="/shelter_dashboard/:nested" element={<Shelter_Dashboard/>} />
          <Route path="/dashboard" element={<Farmer_Dashboard />} />
          <Route path="/account-info" element={<Account_info />} />
          <Route path="/add_new_cattle" element={<Add_new_cattle />} />
          <Route path="/view_cattle_list" element={<View_cattle_list />} />
          <Route path="/appointment_info" element={<Appointment_info />} />
          <Route path="/request_vet" element={<Request_vet/>} />
          <Route path="/ownership_transfer" element={<Ownership_transfer />} />
          <Route path="/retirement_request" element={<Retirement_request />} />
        </Route>
      </Routes>
    </ErrorBoundary> 
  )
}

export default App