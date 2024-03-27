import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import Swatches from './components/Swatches'
import DropDown from './components/DropDown'
import RangeSlider from './components/RangeSlider'

import optionsJson from "../../json/options.json";
import { createPortal } from 'react-dom';

import "./App.scss";
import './App.css'

function App() {
  const [productInfo, setProductInfo] = useState({})
  const [filteredOptions, setFilteredOptions] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quantity, setQuantity] = useState(1)

  const [featuredMedia, setFeaturedMedia] = useState(null)

  const [isDisabled, setIsDisabled] = useState(true)


  useEffect(() => {
    console.log('useEffect getProductById()')

    // console.log('optionsJson', optionsJson)

    getProductById()
  }, [])


  useEffect(() => {
    console.log('useEffect productInfo', productInfo)
    if (
      Object.keys(productInfo).length &&
      ('options' in productInfo)
    ) {
      // console.log('useEffect productInfo.options', productInfo.options)
      setFilteredOptions([...productInfo.options])
    }
  }, [productInfo])


  useEffect(() => {
    // console.log('useEffect filteredOptions', filteredOptions)

    if ( !Object.keys(selectedOptions).length && !!filteredOptions.length ) {
      // console.log('productInfo?.variants?.length', productInfo?.variants?.length)
      // console.log('productInfo.options', productInfo.options)

      const initiallySelectedOptions = {}
      let initiallySelectedOptionIndex = 0

      for ( let index = 0; index < filteredOptions.length; index++ ) {
        const mainOption = filteredOptions[index]
        // console.log('mainOption.option_slug', mainOption.option_slug)

        if (!mainOption?.option_values?.length) {
          continue
        }

        const mainOptionValue = mainOption.option_values[0]
        // console.log('mainOptionValue', mainOptionValue)

        // 
        const foundOptionInJson = optionsJson.find(ojOption => ojOption.slug === mainOption.option_slug)
        let shouldSkipThisOption = false
        if (foundOptionInJson?.showOnlyWhen) {
          const foundSelectedOption = Object.values(initiallySelectedOptions).find(initiallySelectedOption => (
            (initiallySelectedOption.option_slug === foundOptionInJson.showOnlyWhen.optionSlug) &&
            (initiallySelectedOption.option_value_slug === foundOptionInJson.showOnlyWhen.optionValueSlug)
          ))
          if (!foundSelectedOption) {
            shouldSkipThisOption = true
          }
        }

        if (foundOptionInJson?.hideOnlyWhen) {
          const foundSelectedOption = Object.values(initiallySelectedOptions).find(initiallySelectedOption => (
            (initiallySelectedOption.option_slug === foundOptionInJson.hideOnlyWhen.optionSlug) &&
            foundOptionInJson.hideOnlyWhen.optionValueSlug.includes(initiallySelectedOption.option_value_slug)
          ))
          if (foundSelectedOption) {
            shouldSkipThisOption = true
          }
        }

        if (shouldSkipThisOption) {
          continue
        }
        // 

        const option_with_value = {
          option_id: mainOption.option_id,
          option_title: mainOption.option_title,
          option_slug: mainOption.option_slug,
          option_type: mainOption.option_type,

          file_id: mainOptionValue.file_id,
          option_image_path: mainOptionValue.option_image_path,
          option_value_id: mainOptionValue.option_value_id,
          option_value_price: mainOptionValue.option_value_price,
          option_value_title: mainOptionValue.option_value_title,
          option_value_slug: mainOptionValue.option_value_slug,

          change_media: !!foundOptionInJson?.changeMedia ? true : false
        }
        initiallySelectedOptions[initiallySelectedOptionIndex] = option_with_value

        ++initiallySelectedOptionIndex
      }

      // console.log('initiallySelectedOptions', initiallySelectedOptions)

      setSelectedOptions(initiallySelectedOptions)
    }

    /*
    if ( !Object.keys(selectedOptions).length && !!filteredOptions.length && !!productInfo?.variants?.length ) {

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
                option_type: matchedOption.option_type,

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
          option_type: mainOption.option_type,

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
    */
  }, [filteredOptions])


  useEffect(() => {
    // console.log('useEffect selectedOptions', selectedOptions)

    if (!!Object.keys(selectedOptions).length) {


      // Set Filtered Options START
      let availableOptionInputsValues = []
      for (let index = 0; index < Object.values(selectedOptions).length; index++) {
        const selectedOption = Object.values(selectedOptions)[index]
        // console.log('selectedOption', selectedOption)

        const productInfo_found_option = productInfo.options.find(productInfo_option => productInfo_option.option_slug === selectedOption.option_slug)

        availableOptionInputsValues.push({
          option_id: productInfo_found_option.option_id,
          option_title: productInfo_found_option.option_title,
          option_slug: productInfo_found_option.option_slug,
          option_type: productInfo_found_option.option_type,
          option_values: productInfo_found_option.option_values
        })
      }
      setFilteredOptions(availableOptionInputsValues)
      // Set Filtered Options END

      // Change Media START
      
      const selectedOptionString = Object.values(selectedOptions).filter(selectedOption => !!selectedOption.change_media).map(selectedOption => selectedOption.option_value_title).join(' / ')
      if (!!selectedOptionString) {
        const selectedMedia = productInfo.medias.find(medaa => medaa.media_title === selectedOptionString)
        if (!!selectedMedia) {
          setFeaturedMedia(selectedMedia.media_image_path)
        } else {
          setFeaturedMedia(null)
        }
      }
      // Change Media END
    }

    /*
    if (!!Object.keys(selectedOptions).length) {

      const selectedOptionOneVariants = productInfo?.variants?.filter(variant => variant.variant_options[0].option_value_id === selectedOptions[0].option_value_id)
      // console.log('selectedOptionOneVariants', selectedOptionOneVariants)

      if (!!selectedOptionOneVariants) {
        const inputWrappers = productInfo.options.filter(po => !!po?.option_values)
  
        let availableOptionInputsValues = []
  
        inputWrappers.forEach((option, index) => {
          if (index === 0) {
            availableOptionInputsValues.push(option)
            return;
          }
  
          const previousOptionSelected = selectedOptions[index - 1]
  
          const availableOptionInputsValue = selectedOptionOneVariants
          .filter(variant => variant.variant_options[index-1].option_value_id === previousOptionSelected.option_value_id)
          .map(variantOption => variantOption.variant_options[index].option_value_id)
  
          // 
          availableOptionInputsValues.push({
            option_id: option.option_id,
            option_title: option.option_title,
            option_slug: option.option_slug,
            option_type: option.option_type,
  
            option_values: option.option_values.filter(ov => availableOptionInputsValue.includes(ov.option_value_id))
          })
          // 
        })
  
        setFilteredOptions(availableOptionInputsValues)
      }
    }
    */

    // 
    // const params = new URLSearchParams(window.location.search)
    const params = new URLSearchParams()
    Object.keys(selectedOptions).forEach((index) => {
      params.set(
        selectedOptions[index].option_slug,
        selectedOptions[index].option_value_slug
      )
    })
    // console.log('params', params)
    window.history.replaceState("", "", "?" + params.toString())
    // 

  }, [selectedOptions])


  useEffect(() => {
    if (!!featuredMedia) {
      console.log('useEffect featuredMedia', featuredMedia)
      document.querySelector('media-gallery[id*="MediaGallery-template--"][id*="__main"]').style.display = 'none'
    } else {
      document.querySelector('media-gallery[id*="MediaGallery-template--"][id*="__main"]').style.display = 'block'
    }
  }, [featuredMedia])


  const onSelectOption = (option_index, optn, option_value) => {
    // console.log('onSelectOption, option_index, optn, option_value', option_index, optn, option_value)
    // console.log('onSelectOption optionsJson', optionsJson)
    // console.log('onSelectOption productInfo.options', productInfo.options)

    const option_with_value = {
      option_id: optn.option_id,
      option_title: optn.option_title,
      option_slug: optn.option_slug,
      option_type: optn.option_type,

      file_id: option_value.file_id,
      option_image_path: option_value.option_image_path,
      option_value_id: option_value.option_value_id,
      option_value_price: option_value.option_value_price,
      option_value_title: option_value.option_value_title,
      option_value_slug: option_value.option_value_slug
    }
    // console.log('option_with_value', option_with_value)

    
    setSelectedOptions(prevSelectedOptions => {

      // console.log('prevSelectedOptions', prevSelectedOptions)

      // New logic START
      let selectedIndex = 0
      let newSelectedOptions = {}
      productInfo.options.forEach((productInfoOption, productInfoOptionIndex) => {
        // console.log('productInfoOption', productInfoOption)

        if (!productInfoOption?.option_values?.length) {
          return
        }
  
        if ( option_with_value.option_slug === productInfoOption.option_slug ) {
          const foundOptionFromJson = optionsJson.find(singleOptionFromJson => singleOptionFromJson.slug === productInfoOption.option_slug)
          newSelectedOptions[selectedIndex] = {
            ...option_with_value,
            change_media: !!foundOptionFromJson?.changeMedia ? true : false
          }
        } else {
          const foundOptionFromJson = optionsJson.find(singleOptionFromJson => singleOptionFromJson.slug === productInfoOption.option_slug)

          let shouldWeAddThisOption = true
          if (foundOptionFromJson?.showOnlyWhen) {
            const showOnlyWhenOptionSlug = foundOptionFromJson.showOnlyWhen.optionSlug
            const showOnlyWhenOptionValueSlug = foundOptionFromJson.showOnlyWhen.optionValueSlug
            const testing = Object.values(newSelectedOptions).find(newSelectedOption => (
              newSelectedOption.option_slug === showOnlyWhenOptionSlug && newSelectedOption.option_value_slug === showOnlyWhenOptionValueSlug
            ))
            if (!testing) {
              return
            }
          }

          if (foundOptionFromJson?.hideOnlyWhen) {
            const showOnlyWhenOptionSlug = foundOptionFromJson.hideOnlyWhen.optionSlug
            const showOnlyWhenOptionValueSlug = foundOptionFromJson.hideOnlyWhen.optionValueSlug
            const testing = Object.values(newSelectedOptions).find(newSelectedOption => (
              newSelectedOption.option_slug === showOnlyWhenOptionSlug && showOnlyWhenOptionValueSlug.includes(newSelectedOption.option_value_slug)
            ))
            if (!!testing) {
              return
            }
          }

          let previousOpton = Object.values(prevSelectedOptions).find(prevSelectedOption => prevSelectedOption.option_slug === productInfoOption.option_slug)
          if (!previousOpton) {
            previousOpton = {
              option_id: productInfoOption.option_id,
              option_title: productInfoOption.option_title,
              option_slug: productInfoOption.option_slug,
              option_type: productInfoOption.option_type,
        
              file_id: productInfoOption.option_values[0].file_id,
              option_image_path: productInfoOption.option_values[0].option_image_path,
              option_value_id: productInfoOption.option_values[0].option_value_id,
              option_value_price: productInfoOption.option_values[0].option_value_price,
              option_value_title: productInfoOption.option_values[0].option_value_title,
              option_value_slug: productInfoOption.option_values[0].option_value_slug,

              change_media: !!foundOptionFromJson?.changeMedia ? true : false
            }
          }

          newSelectedOptions[selectedIndex] = previousOpton
        }
  
        ++selectedIndex
      })
      // console.log('newSelectedOptions', newSelectedOptions)
      // New logic END

      return newSelectedOptions
      // // const newSelectedOptions = { ...prevSelectedOptions }
      // // if ( newSelectedOptions[option_index]?.option_value_id === option_with_value.option_value_id ) {
      // //   delete newSelectedOptions[option_index]
      // //   return {
      // //     ...newSelectedOptions
      // //   }
      // // } else {
      //   return {
      //     ...prevSelectedOptions,
      //     [option_index]: option_with_value
      //   }
      // // }

    })
  }


  const getProductById = async () => {
    const productResponse = await fetch(`/apps/jewelry-builder-app/api/product/${ShopifyAnalytics.meta.product.id}`).then((response) => response.json())
    if (!!productResponse && !!productResponse.success) {
      setProductInfo(productResponse.data)
    }
  }


  const setQuantityInput = (valueAsNumber) => {
    if ( typeof valueAsNumber === "number" && valueAsNumber > 0 ) {
      setQuantity(parseInt(valueAsNumber))
    } else {
      setQuantity(1)
    }
  }


  return (
    <>
      {!!featuredMedia && createPortal(
        <img
          src={
            featuredMedia.includes('http') ? featuredMedia : `/apps/jewelry-builder-app${featuredMedia}`
          }
          dataSelectedOptions={JSON.stringify(featuredMedia)}
          style={{
            width: '100%',
            height: '100%'
          }}
        />,
        document.querySelector('#jewelry-builder-app-media-wrapper')
      )}

      {
        !!filteredOptions.length &&
        filteredOptions.map((optn, option_index) => {

          // console.log('optn, optn.option_type', optn, optn.option_type)

          let OptionComponent

          switch (optn.option_type) {
            case 'swatch':
              OptionComponent = Swatches
              break;
            case 'range':
              OptionComponent = RangeSlider
              break;
            case 'select':
              OptionComponent = DropDown
              break;
            default:
              OptionComponent = Swatches
              break;
          }

          return (
            !!optn?.option_values?.length
            ?
            <fieldset id={`fieldset_${optn.option_id}`}>
              <OptionComponent optn={optn} option_index={option_index} selectedOptions={selectedOptions} onSelectOption={onSelectOption} />
            </fieldset>
            :
            <></>
          )
        })
      }
      <fieldset>
        <legend>Quantity:</legend>
        <div className='quantity-input'>
          <button type="button" onClick={() => setQuantityInput(quantity - 1)} disabled={(quantity === 1) ? true : false}>-</button>
          <input
            type="number"
            name="quantity"
            id=""
            value={quantity}
            min={1}
            step={1}
            inputMode='numeric'
            pattern='\d*'
            onChange={(event) => setQuantityInput(event.target.valueAsNumber)}
          />
          <button type="button" onClick={() => setQuantityInput(quantity + 1)}>+</button>
        </div>
      </fieldset>

      <fieldset>
        <button type="submit" disabled={isDisabled}>
          Add to cart
        </button>
      </fieldset>
    </>
  )
}

export default App