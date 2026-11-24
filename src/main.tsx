import {createRoot} from 'react-dom/client';
import {installApiClient} from './lib/apiClient';
import App from './App.tsx';
import './index.css';

installApiClient();

createRoot(document.getElementById('root')!).render(<App />);
