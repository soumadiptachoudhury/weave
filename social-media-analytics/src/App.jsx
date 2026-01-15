import { useState } from 'react'
import TopNav from './TopNav'
import Pulse from './Pulse'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='top-header'>
        
        <TopNav />
      </div>
        
    </>
  )
}

export default App
