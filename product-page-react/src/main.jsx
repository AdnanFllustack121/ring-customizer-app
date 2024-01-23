import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.querySelector('[id*="shopify-block-ring_customizer_app_product_options_"][data-block-handle="product_options"]')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)