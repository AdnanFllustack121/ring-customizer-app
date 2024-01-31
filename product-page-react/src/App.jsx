import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [productInfo, setProductInfo] = useState({})
  const [filteredOptions, setFilteredOptions] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})


  useEffect(() => {
    console.log('useEffect productInfo', productInfo)
    if (Object.keys(productInfo).length && ('options' in productInfo)) {
      setFilteredOptions([...productInfo.options])
    } else {
      getProductById()
    }
  }, [productInfo])


  useEffect(() => {
    console.log('useEffect filteredOptions', filteredOptions)
    if ( !Object.keys(selectedOptions).length && !!filteredOptions.length && !!productInfo.variants.length ) {

      const searchParams = new URLSearchParams(window.location.search)

      let firstFoundVariant = productInfo.variants[0]

      //
      if (searchParams.size) {

        let productInfoVariants = productInfo.variants
        let matchedOptionsWithValues = []
        for (const [key, value] of searchParams.entries()) {
          const matchedOption = productInfo.options.find(pio => pio.option_slug === key)
          if (!!matchedOption) {
            const matchedOptionValue = matchedOption.option_values.find(ov => ov.option_value_slug === value)
            if (!!matchedOptionValue) {
              const option_with_value = {
                option_id: matchedOption.option_id,
                option_title: matchedOption.option_title,
                option_slug: matchedOption.option_slug,

                file_id: matchedOptionValue.file_id,
                option_image_path: matchedOptionValue.option_image_path,
                option_value_id: matchedOptionValue.option_value_id,
                option_value_price: matchedOptionValue.option_value_price,
                option_value_title: matchedOptionValue.option_value_title,
                option_value_slug: matchedOptionValue.option_value_slug
              }
              matchedOptionsWithValues.push(option_with_value)
            }
          }
        }
        console.log('matchedOptionsWithValues', matchedOptionsWithValues)

        let newFoundVariant = productInfo.variants.find(variant => {
          let isVariantFound = false
          let variant_option_value_ids = variant.variant_options.map(vvo => vvo.option_value_id)
          console.log('variant_option_value_ids', variant_option_value_ids)

          let matchedOptionsWithValuesIds = matchedOptionsWithValues.map(mowv => mowv.option_value_id)
          console.log('matchedOptionsWithValuesIds', matchedOptionsWithValuesIds)

          isVariantFound = variant_option_value_ids.every(vovi => matchedOptionsWithValuesIds.includes(vovi))
          return isVariantFound
        })
        console.log('newFoundVariant', newFoundVariant)

        if (!!newFoundVariant) {
          firstFoundVariant = newFoundVariant
        }
      }
      console.log('firstFoundVariant', firstFoundVariant)
      //

      // else {
      const firstFoundVariantOptions = firstFoundVariant.variant_options
      console.log('firstFoundVariantOptions', firstFoundVariantOptions)

      const initiallySelectedOptions = {}
      for ( let index = 0; index < firstFoundVariantOptions.length; index++ ) {
        const firstFoundVariantOption = firstFoundVariantOptions[index]

        const mainOption = filteredOptions[index]

        const mainOptionValue = mainOption.option_values.find(ov => ov.option_value_id === firstFoundVariantOption.option_value_id)
        // console.log('mainOptionValue', mainOptionValue)

        const option_with_value = {
          option_id: mainOption.option_id,
          option_title: mainOption.option_title,
          option_slug: mainOption.option_slug,

          file_id: mainOptionValue.file_id,
          option_image_path: mainOptionValue.option_image_path,
          option_value_id: mainOptionValue.option_value_id,
          option_value_price: mainOptionValue.option_value_price,
          option_value_title: mainOptionValue.option_value_title,
          option_value_slug: mainOptionValue.option_value_slug
        }
        initiallySelectedOptions[index] = option_with_value
      }

      setSelectedOptions(initiallySelectedOptions)
      // }

    }
  }, [filteredOptions])


  useEffect(() => {
    console.log('useEffect selectedOptions', selectedOptions)

    if (!!Object.keys(selectedOptions).length) {

      const selectedOptionOneVariants = productInfo.variants.filter(variant => variant.variant_options[0].option_value_id === selectedOptions[0].option_value_id)

      const inputWrappers = productInfo.options

      let availableOptionInputsValues = []

      inputWrappers.forEach((option, index) => {
        if (index === 0) {
          availableOptionInputsValues.push(option)
          return;
        }

        // const optionInputs = option.option_values;

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
          option_slug: option.option_slug,
          option_values: option.option_values.filter(ov => availableOptionInputsValue.includes(ov.option_value_id))
        })
        // 
      })

      setFilteredOptions(availableOptionInputsValues)
    }

    // 
    const params = new URLSearchParams(window.location.search)
    console.log('params', params)
    // if (!params.size) {
      Object.keys(selectedOptions).forEach((index) => {
        params.set(selectedOptions[index].option_slug, selectedOptions[index].option_value_slug)
      })
      window.history.replaceState("", "", '?' + params.toString())
    // }
    // 

  }, [selectedOptions])


  const getProductById = async () => {
    const productResponse = await fetch(`/apps/product-options/api/product/${ShopifyAnalytics.meta.product.id}`).then((response) => response.json())
    if (!!productResponse && !!productResponse.success) {
      setProductInfo(productResponse.data)
    }
  }


  const onSelectOption = (option_index, optn, option_value) => {
    console.log('onSelectOption')

    const option_with_value = {
      option_id: optn.option_id,
      option_title: optn.option_title,
      option_slug: optn.option_slug,

      file_id: option_value.file_id,
      option_image_path: option_value.option_image_path,
      option_value_id: option_value.option_value_id,
      option_value_price: option_value.option_value_price,
      option_value_title: option_value.option_value_title,
      option_value_slug: option_value.option_value_slug
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
                          name={`properties[${optn.option_title}]`}
                          value={option_value.option_value_title}
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