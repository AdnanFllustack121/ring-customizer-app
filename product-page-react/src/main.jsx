import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'


// Media
const div = document.createElement('div')
div.id = 'jewelry-builder-app-media-wrapper'
document.querySelector('.grid__item.product__media-wrapper').appendChild(div)
// ReactDOM.createRoot(div)

// App
ReactDOM.createRoot(document.querySelector('[id*="shopify-block-"][data-block-handle="product_options"]')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)