import Navbar from '../components/layout/Navbar'

export const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
