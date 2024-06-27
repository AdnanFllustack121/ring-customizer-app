import React from 'react'
import ReactDOM from 'react-dom/client'

import { I18nContext, I18nManager } from "@shopify/react-i18n";

import App from './App.jsx'

// import CollectionApp from "./CollectionApp.jsx";

import './index.css'


// 
const locale = !!window?.Shopify?.locale ? window.Shopify.locale : "en"
const i18nManager = new I18nManager({
  locale,
  onError(error) {
    console.error(error);
  }
})
// 


// Media
// const mediaSelector = '[id*="Media"][id*="-template--"][id*="__main"]'
// const div = document.createElement('div')
// div.id = 'jewelry-builder-app-media-wrapper'
// document.querySelector(mediaSelector).parentNode.appendChild(div)
// ReactDOM.createRoot(div)

console.log('window.meta.page.pageType', window.meta.page.pageType)

if ( "product" === window.meta.page.pageType ) {

  // Product Page App START
  ReactDOM.createRoot(document.querySelector('[id="jewelry-builder-app-root"]')).render(
    <React.StrictMode>
      <I18nContext.Provider value={i18nManager}>
        {/* <App mediaSelector={mediaSelector} /> */}
        <App />
      </I18nContext.Provider>
    </React.StrictMode>,
  )
  // Product Page App END
}


// if ( "collection" === window.meta.page.pageType ) {

//   ReactDOM.createRoot(document.querySelector('#jewelry-builder-app-collection-root')).render(
//     <React.StrictMode>
//       <I18nContext.Provider value={i18nManager}>
//         <CollectionApp />
//       </I18nContext.Provider>
//     </React.StrictMode>,
//   )
// }