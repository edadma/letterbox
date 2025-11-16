import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Accounts from './pages/Accounts'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Accounts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
