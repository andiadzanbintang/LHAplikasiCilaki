import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import './App.css'
import Dashboard from './pages/Dashboard';
import FormPages from './pages/FormPages';
import Navbar from './components/Navbar';

axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
axios.defaults.withCredentials = true;

function App() {
  

  return (
    <>
      <Toaster
        toastOptions={{
          duration: 2000
        }}
      />
      <Navbar />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/form' element={<FormPages />} />
      </Routes>
    </>
  )
}

export default App
