import { Route, Routes } from "react-router-dom"
import ErrorBoundary from "./components/ErrorBoundary"
import ScrollToTop from "./components/ScrollToTop"
import Home from "./Page/Home"
import Signup from "./Page/Signup"
import Login from "./Page/Login"
import Forget from "./Page/Forget"
import Contact from "./Page/Contact"
import Dashboard from "./Page/Dashboard/Dashboard"
import { ProtectedRoute, PublicOnlyRoute } from "./components/route-guards"
import Account_info from "./Page/Logics/Account_info"
import Dialog from "./Page/Dialog"
import Add_new_cattle from "./Page/Logics/Add_new_cattle"
import InaphPage from "./Page/InaphPage"
import InaphLogin from "./Page/InaphLogin"
import View_cattle_list from "./Page/Logics/View_cattle_list"


const App = () => {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
          <Route path="/" element={<Home/>}/>
        <Route element={<PublicOnlyRoute/>}>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/InaphPage" element={<InaphPage/>}/>
          <Route path="/InaphLogin" element={<InaphLogin/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/forget" element={<Forget/>}/>
          <Route path="/dialog" element={<Dialog/>}/>
        </Route>
        <Route path="/Contact" element={<Contact/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/account-info" element={<Account_info/>}/>
          <Route path="/add_new_cattle" element={<Add_new_cattle/>}/>
          <Route path="/view-cattle-list" element={<View_cattle_list/>}/>
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App