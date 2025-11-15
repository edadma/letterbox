import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import RegisterAccount from './pages/RegisterAccount'
import Mailbox from './pages/Mailbox'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register-account" element={<RegisterAccount />} />
          <Route path="/" element={<Mailbox />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
