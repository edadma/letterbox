import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Accounts from './pages/Accounts'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Accounts />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
