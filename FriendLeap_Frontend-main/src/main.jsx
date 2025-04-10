import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from './components/ui/sonner.jsx'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import { SocketProvider } from './socketContext.jsx'


let persistor = persistStore(store)

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>

        <SocketProvider>
        <App />
        </SocketProvider>
        
        <Toaster />
      </PersistGate>
    </Provider>
  
)
