import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { AuthPage } from './pages/AuthPage';
import { GamePage } from './pages/GamePage';
import { SuccessPage } from './pages/SuccessPage';
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path='/auth' element={<AuthPage />} />
          <Route path='/game' element={<GamePage />} />
          <Route path='/success' element={<SuccessPage />} />
          <Route path='*' element={<Navigate to='/auth' replace />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
