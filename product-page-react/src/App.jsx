import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [productInfo, setProductInfo] = useState({})
  console.log('productInfo', productInfo)

  const [selectedOptions, setSelectedOptions] = useState({})
  console.log('selectedOptions', selectedOptions)

  useEffect(() => {
    getProductById()
  }, [])


  const getProductById = async () => {
    const productResponse = await fetch(`/apps/product-options/api/product/${ShopifyAnalytics.meta.product.id}`).then((response) => response.json())

    if (!!productResponse && !!productResponse.success) {
      setProductInfo(productResponse.data)
    }
  }


  const onSelectOption = (option_index, optn, option_value) => {
    const option_with_value = {
      option_id: optn.option_id,
      option_title: optn.option_title,

      file_id: option_value.file_id,
      option_image_path: option_value.option_image_path,
      option_value_id: option_value.option_value_id,
      option_value_price: option_value.option_value_price,
      option_value_title: option_value.option_value_title
    }

    setSelectedOptions((prevSelectedOptions) => {
      const newSelectedOptions = { ...prevSelectedOptions }
      if ( newSelectedOptions[option_index]?.option_value_id === option_with_value.option_value_id ) {
        delete newSelectedOptions[option_index]
        return {
          ...newSelectedOptions
        }
      } else {
        return {
          ...prevSelectedOptions,
          [option_index]: option_with_value
        }
      }
    })
  }


  return (
    <>

      {
        !!productInfo?.options &&
        productInfo.options.map((optn, option_index) => {
          return (
            <fieldset>
              <legend>{optn.option_title}:</legend>
              {
                !!optn?.option_values &&
                optn.option_values.map(option_value => {
                  return (
                    <>
                      <label htmlFor={option_value.option_value_id}>
                        {
                          !!option_value.option_image_path
                          ?
                          <img src={`/apps/product-options${option_value.option_image_path}`} alt="" />
                          :
                          option_value.option_value_title
                        }
                        <input
                          type="radio"
                          name={optn.option_title}
                          id={option_value.option_value_id}
                          onClick={() => onSelectOption(option_index, optn, option_value)}
                          checked={selectedOptions[option_index]?.option_value_id === option_value.option_value_id}
                        />
                      </label>
                    </>
                  )
                })
              }
            </fieldset>
          )
        })
      }

    </>
  )
}

export default App