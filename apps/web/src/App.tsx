import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-base-200">
        <div className="navbar bg-base-100 shadow-lg">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">Letterbox</a>
          </div>
          <div className="flex-none">
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>

        <div className="hero min-h-[calc(100vh-4rem)]">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">Welcome to Letterbox</h1>
              <p className="py-6">
                A modern web application built with React, AdonisJS, and real-time capabilities.
              </p>
              <button className="btn btn-primary">Get Started</button>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
