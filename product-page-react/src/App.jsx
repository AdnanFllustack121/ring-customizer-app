import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [productInfo, setProductInfo] = useState({})
  const [filteredOptions, setFilteredOptions] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})


  useEffect(() => {
    if (Object.keys(productInfo).length && ('options' in productInfo)) {
      setFilteredOptions([...productInfo.options])
    } else {
      getProductById()
    }
  }, [productInfo])


  useEffect(() => {
    if ( !Object.keys(selectedOptions).length && !!filteredOptions.length && !!productInfo.variants.length ) {
      
      const firstFoundVariant = productInfo.variants[0]
      const firstFoundVariantOptions = firstFoundVariant.variant_options

      const initiallySelectedOptions = {}
      for ( let index = 0; index < firstFoundVariantOptions.length; index++ ) {
        const firstFoundVariantOption = firstFoundVariantOptions[index]

        const mainOption = filteredOptions[index]

        const mainOptionValue = mainOption.option_values.find(ov => ov.option_value_id === firstFoundVariantOption.option_value_id)

        const option_with_value = {
          option_id: mainOption.option_id,
          option_title: mainOption.option_title,
    
          file_id: mainOptionValue.file_id,
          option_image_path: mainOptionValue.option_image_path,
          option_value_id: mainOptionValue.option_value_id,
          option_value_price: mainOptionValue.option_value_price,
          option_value_title: mainOptionValue.option_value_title
        }
        initiallySelectedOptions[index] = option_with_value
      }

      setSelectedOptions(initiallySelectedOptions)
    }
  }, [filteredOptions])


  useEffect(() => {
    if (!!Object.keys(selectedOptions).length) {
      console.log('useEffect selectedOptions', selectedOptions)

      const selectedOptionOneVariants = productInfo.variants.filter(variant => variant.variant_options[0].option_value_id === selectedOptions[0].option_value_id)

      const inputWrappers = productInfo.options

      let availableOptionInputsValues = []

      inputWrappers.forEach((option, index) => {
        if (index === 0) {
          availableOptionInputsValues.push(option)
          return;
        }

        const optionInputs = option.option_values;

        const previousOptionSelected = selectedOptions[index - 1]

        const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => {
          return variant.variant_options[index-1].option_value_id === previousOptionSelected.option_value_id
        })
        .map((variantOption) => {
          return variantOption.variant_options[index].option_value_id
        })

        // 
        availableOptionInputsValues.push({
          option_id: option.option_id,
          option_title: option.option_title,
          option_values: option.option_values.filter(ov => availableOptionInputsValue.includes(ov.option_value_id))
        })
        // 
      })

      setFilteredOptions(availableOptionInputsValues)
    }
  }, [selectedOptions])


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

    setSelectedOptions(prevSelectedOptions => {
      const newSelectedOptions = { ...prevSelectedOptions }
      // if ( newSelectedOptions[option_index]?.option_value_id === option_with_value.option_value_id ) {
      //   delete newSelectedOptions[option_index]
      //   return {
      //     ...newSelectedOptions
      //   }
      // } else {
        return {
          ...prevSelectedOptions,
          [option_index]: option_with_value
        }
      // }
    })
  }


  return (
    <>
      {
        !!filteredOptions.length &&
        filteredOptions.map((optn, option_index) => {
          return (
            <fieldset>
              <legend>{optn.option_title}:</legend>
              {
                !!optn?.option_values &&
                optn.option_values.map(option_value => {
                  return (
                    <>
                      <label htmlFor={option_value.option_value_id}>

                        <span className='tooltiptext'>{option_value.option_value_title}</span>

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