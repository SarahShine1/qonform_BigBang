import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import GestionDocumentaire from './pages/SupportDocumentaire'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    // Rôle chef projet → bouton upload visible
  <GestionDocumentaire user={{ role: 'chef_projet', first_name: 'Ahmed' }} />

/* Rôle auditeur → bouton upload masqué
  // <GestionDocumentaire user={{ role: 'auditeur' }} />  */
  )
}

export default App
