import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { useI18n } from '@shopify/react-i18n';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import Swatches from './components/Swatches'
import DropDown from './components/DropDown'
import RangeSlider from './components/RangeSlider'

import optionsJson from "../../json/options.json";
import { RingBuilderPriceCall } from './priceCalculator';

import "./App.scss";
import './App.css'

const proxyBaseUrl = `/apps/jewelry-builder-app`
const currency = !!window?.Shopify?.currency?.active ? window.Shopify.currency.active : 'USD'

// function App({ mediaSelector }) {
function App() {
  const [productInfo, setProductInfo] = useState({})
  const [filteredOptions, setFilteredOptions] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quantity, setQuantity] = useState(1)

  const [featuredMediaIndex, setFeaturedMediaIndex] = useState(null)
  const [allMedias, setAllMedias] = useState(null)
  const [isFirstUnavailable, setIsFirstUnavailable] = useState(false)

  const [isDisabled, setIsDisabled] = useState(false)

  const [metaFieldData, setMetaFieldData] = useState({})

  const [finalProductPrice, setFinalProductPrice] = useState(0)

  // console.log('useI18n', useI18n)
  const [i18n] = useI18n()
  // console.log('i18n', i18n)


  useEffect(() => {
    console.log('useEffect metaFieldData', metaFieldData)
  }, [metaFieldData])


  useEffect(() => {
    console.log('useEffect getProductById()')

    // 
    const jewelrybuilderapp_script_tag = document.querySelector('#jewelrybuilderapp')
    if (!!jewelrybuilderapp_script_tag && !!jewelrybuilderapp_script_tag?.text) {
      const jewelrybuilderapp_json = JSON.parse(jewelrybuilderapp_script_tag.text)
      setMetaFieldData(jewelrybuilderapp_json)
    }
    // 

    // console.log('optionsJson', optionsJson)

    getProductById()
  }, [])


  useEffect(() => {
    // console.log('useEffect productInfo', productInfo)
    if (
      Object.keys(productInfo).length &&
      ('options' in productInfo)
    ) {
      console.log('useEffect productInfo', productInfo)
      setFilteredOptions([...productInfo.options])
    }
  }, [productInfo])


  useEffect(() => {

    if ( !Object.keys(selectedOptions).length && !!filteredOptions.length ) {
      console.log('useEffect filteredOptions', filteredOptions)

      const searchParams = new URLSearchParams(window.location.search)
      console.log('searchParams', searchParams, window.location.search, JSON.stringify(searchParams))

      // console.log('productInfo?.variants?.length', productInfo?.variants?.length)
      // console.log('productInfo.options', productInfo.options)

      const initiallySelectedOptions = {}
      let initiallySelectedOptionIndex = 0

      for ( let index = 0; index < filteredOptions.length; index++ ) {
        const mainOption = filteredOptions[index]
        console.log('mainOption.option_slug', mainOption.option_slug)

        if (!mainOption?.option_values?.length) {
          continue
        }

        let mainOptionValue = mainOption.option_values[0]

        if (!!searchParams.size && searchParams.has(mainOption.option_slug)) {
          const searchParamsoption_slug = searchParams.get(mainOption.option_slug)
          const foundOptionValue = mainOption.option_values.find(mainOption_option_values => mainOption_option_values.option_value_slug === searchParamsoption_slug)
          if (foundOptionValue) {
            mainOptionValue = foundOptionValue
          }
        }

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

      console.log('initiallySelectedOptions', initiallySelectedOptions)

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

    if (!!Object.keys(selectedOptions).length) {
      console.log('useEffect selectedOptions', selectedOptions)


      // Set Filtered Options START
      let availableOptionInputsValues = []
      for (let index = 0; index < Object.values(selectedOptions).length; index++) {
        const selectedOption = Object.values(selectedOptions)[index]
        console.log('selectedOption', selectedOption)

        const productInfo_found_option = productInfo.options.find(productInfo_option => productInfo_option.option_slug === selectedOption.option_slug)

        let new_option_values = productInfo_found_option.option_values

        // Special condition for center_stone_weight START
        if (productInfo_found_option.option_slug === 'center_stone_weight') {
          const center_stone_weights = optionsJson.find(optionFromJson => optionFromJson.slug === 'center_stone_weight')

          const center_stone_type_with_value = Object.values(selectedOptions).find(selectedOption_option_slug => selectedOption_option_slug.option_slug === 'center_stone_type')

          new_option_values = productInfo_found_option.option_values.filter(found_option_value => {

            const center_stone_weight_value_from_option_json = center_stone_weights.values.find(center_stone_weight_value_from_option_json => {
              return center_stone_weight_value_from_option_json.optionValueTitle === found_option_value.option_value_slug
            })
            // console.log('center_stone_weight_value_from_option_json', center_stone_weight_value_from_option_json)
            
            if (!!center_stone_weight_value_from_option_json?.hideOnlyWhen) {

              if ( !!center_stone_weight_value_from_option_json.hideOnlyWhen?.ProductType ) {

                if ( center_stone_weight_value_from_option_json.hideOnlyWhen.ProductType === productInfo.product_type && center_stone_type_with_value.option_value_slug === "ld" ) {
                  return false
                } else {
                  return true
                }

              }


              if (center_stone_type_with_value.option_value_slug === "ld") {
                return false
              }

            }


            return true
          })
        }
        // Special condition for center_stone_weight END

        availableOptionInputsValues.push({
          option_id: productInfo_found_option.option_id,
          option_title: productInfo_found_option.option_title,
          option_slug: productInfo_found_option.option_slug,
          option_type: productInfo_found_option.option_type,
          option_values: new_option_values
        })
      }
      console.log('useEffect selectedOptions availableOptionInputsValues', availableOptionInputsValues)
      setFilteredOptions(availableOptionInputsValues)
      // Set Filtered Options END


      // Change Media START
      const selectedOptionString = Object.values(selectedOptions).filter(selectedOption => !!selectedOption.change_media).map(selectedOption => selectedOption.option_value_title).join(' / ')
      if (!!selectedOptionString && !!productInfo?.medias?.length) {
        const selectedMedia = productInfo.medias.find(medaa => medaa.media_title === selectedOptionString)
        if (!!selectedMedia) {
          setAllMedias(selectedMedia.media_image_paths)
        } else {
          setAllMedias(null)
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
    // const existingParams = new URLSearchParams(window.location.search)
    // console.log('existingParams', existingParams)

    if (!!Object.keys(selectedOptions).length) {
      console.log('Cleaning Params')
      const params = new URLSearchParams()
      Object.keys(selectedOptions).forEach((index) => {
        params.set(
          selectedOptions[index].option_slug,
          selectedOptions[index].option_value_slug
        )
      })
      // console.log('params', params)
      window.history.replaceState("", "", "?" + params.toString())
      console.log('Setting Params')
    }
    // 

    if (!!Object.keys(selectedOptions).length) {
      const final_product_price = RingBuilderPriceCall(productInfo.product_type, metaFieldData.metafields, selectedOptions)
      console.log('final_product_price', final_product_price)
      setFinalProductPrice(final_product_price)
    }


  }, [selectedOptions])


  useEffect(() => {
    // console.log('productInfo.medias', productInfo.medias)
    console.log('useEffect allMedias', allMedias)

    if (!!allMedias && !!allMedias?.length) {
      // document.querySelector(mediaSelector).style.display = 'none'
      setFeaturedMediaIndex(0)
    } else {
      // document.querySelector(mediaSelector).style.display = 'block'
    }
  }, [allMedias])


  useEffect(() => {
    if (isFirstUnavailable) {
      console.log('useEffect isFirstUnavailable', isFirstUnavailable, selectedOptions, filteredOptions)

      const metalTypeOption = filteredOptions.find(filteredOption => filteredOption.option_slug === 'metal_type')
      if (metalTypeOption) {
        const selectedOptionsHavingMedia = Object.values(selectedOptions).filter(selectedOption => !!selectedOption.change_media && selectedOption.option_slug != "metal_type")

        const metalTypeOptionValue = metalTypeOption.option_values.find(metalOptionValue => metalOptionValue.option_value_slug.includes('_ww'))

        const mergedMediaOptions = [...selectedOptionsHavingMedia, metalTypeOptionValue]
        const mediaOptionTitle = mergedMediaOptions.map(mergedMediaOption => mergedMediaOption.option_value_title).join(' / ')

        if (!!productInfo?.medias?.length) {
          const initial_media_image_paths = productInfo.medias.find(media => media.media_title === mediaOptionTitle).media_image_paths
          console.log('initial_media_image_paths', initial_media_image_paths)
          setAllMedias(prevMedias => {
            const newMedias = [...prevMedias]
            for (let index = 1; index <= 5; index++) {
              const initial_media_image_path = initial_media_image_paths[index];
              newMedias[index] = initial_media_image_path
            }
            return [
              ...newMedias
            ]
          })
        }
      }
    }
    setIsFirstUnavailable(false)
  }, [isFirstUnavailable])


  const onSelectOption = (option_index, optn, option_value) => {
    // console.log('onSelectOption option_index, optn, option_value', option_index, optn, option_value)
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
          } else {

            // Special condition for center_stone_weight START
            if ( previousOpton.option_slug === "center_stone_weight" ) {
              console.log('onSelectOption previousOpton old', previousOpton)

              const productInfo_found_option = productInfo.options.find(productInfo_option => productInfo_option.option_slug === "center_stone_weight")
              let new_option_values = productInfo_found_option.option_values
              const center_stone_weights = optionsJson.find(optionFromJson => optionFromJson.slug === 'center_stone_weight')
              const center_stone_type_with_value = Object.values(newSelectedOptions).find(newSelectedOption_option_slug => newSelectedOption_option_slug.option_slug === 'center_stone_type')
              new_option_values = productInfo_found_option.option_values.filter(found_option_value => {

                const center_stone_weight_value_from_option_json = center_stone_weights.values.find(center_stone_weight_value_from_option_json => {
                  return center_stone_weight_value_from_option_json.optionValueTitle === found_option_value.option_value_slug
                })
                // console.log('center_stone_weight_value_from_option_json', center_stone_weight_value_from_option_json)
                
                if (!!center_stone_weight_value_from_option_json?.hideOnlyWhen) {
    
                  if ( !!center_stone_weight_value_from_option_json.hideOnlyWhen?.ProductType ) {
    
                    if ( center_stone_weight_value_from_option_json.hideOnlyWhen.ProductType === productInfo.product_type && center_stone_type_with_value.option_value_slug === "ld" ) {
                      return false
                    } else {
                      return true
                    }
    
                  }
    
    
                  if (center_stone_type_with_value.option_value_slug === "ld") {
                    return false
                  }
    
                }
    
    
                return true
              })
              const foundOptionValueInNewOptionValues = new_option_values.find(new_option_value => new_option_value.option_value_slug === previousOpton.option_value_slug)
              if (!foundOptionValueInNewOptionValues) {
                previousOpton = {
                  option_id: productInfoOption.option_id,
                  option_title: productInfoOption.option_title,
                  option_slug: productInfoOption.option_slug,
                  option_type: productInfoOption.option_type,
    
                  file_id: new_option_values[0].file_id,
                  option_image_path: new_option_values[0].option_image_path,
                  option_value_id: new_option_values[0].option_value_id,
                  option_value_price: new_option_values[0].option_value_price,
                  option_value_title: new_option_values[0].option_value_title,
                  option_value_slug: new_option_values[0].option_value_slug,
    
                  change_media: !!foundOptionFromJson?.changeMedia ? true : false
                }
                console.log('onSelectOption previousOpton', previousOpton)
              }
            }
            // Special condition for center_stone_weight END

          }

          newSelectedOptions[selectedIndex] = previousOpton
        }

        ++selectedIndex
      })
      console.log('onSelectOption newSelectedOptions', newSelectedOptions)
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

  const handleAddToCart = async (event) => {
    setIsDisabled(true)
    
    event.preventDefault()
    
    // setIsAddToCartLoading(true)
    
    console.log('handleAddToCart metaFieldData', metaFieldData)

    
    const line_item_properties = {}
    const formData = {
      options: {}
    }
    

    console.log('selectedOptions', selectedOptions)


    formData.final_product_price = finalProductPrice

    // return
    
    Object.values(selectedOptions).forEach(selected_Option => {
      line_item_properties[selected_Option.option_title] = selected_Option.option_value_title
    })

    for (const key in selectedOptions) {
      const selected_Option = selectedOptions[key]
      if (!!selected_Option) {
        // formData.options[selected_Option.option_title] = {
        //   category_id: selected_Option.category_id,
        //   option_id: selected_Option.option_id
        // }

        formData.options[selected_Option.option_title] = selected_Option.option_value_title
      }
    }

    console.log('line_item_properties', line_item_properties)

    if (Object.keys(formData).length) {

      formData.image = allMedias[0]

      console.log('formData', formData)
  
      const productResponse = await fetch(`${proxyBaseUrl}/api/product/${ShopifyAnalytics.meta.product.id}`, {
        method: "POST",
        body: JSON.stringify(formData)
      }).then((response) => response.json())
      if (
        !!productResponse.success &&
        !!productResponse.data
      ) {
        const ajaxResponse = await fetch(window.Shopify.routes.root + `cart/add.js`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'items': [{
              id: productResponse.data,
              quantity: 1,
              properties: line_item_properties
            }]
          })
        }).then((response) => response.json())

        window.location = '/cart'
        // setIsAddToCartLoading(false)
      } else {
        // setIsAddToCartLoading(false)
      }
    }


  }


  return (
    <div className="product_parent">

      <div id="jewelry-builder-app-media-wrapper">
        {
          // !!allMedias?.length && (featuredMediaIndex !== null)  && createPortal(
          !!allMedias?.length && (featuredMediaIndex !== null)  &&
          <>

            {
              allMedias[featuredMediaIndex].includes('mp4')
              ?
              <video className="video-player" id="myVideo" width="100%" height="100%" autoplay="autoplay" loop="loop">
                <source src={allMedias[featuredMediaIndex]} type="video/mp4" />
              </video>
              :
              <img
                id='image-main'
                src={
                  allMedias[featuredMediaIndex].includes('http') ? allMedias[featuredMediaIndex] : `/apps/jewelry-builder-app${allMedias[featuredMediaIndex]}`
                }
              />
            }

            <ul className="product-image-thumbs">
              {allMedias.map((singleMedia, singleMediaIndex) => {

                // console.log('singleMedia', singleMedia)

                return (
                  <>
                    {
                      !singleMedia
                      ?
                      <></>
                      :
                      (
                        !singleMedia.includes('mp4')
                        ?
                        <li>
                          <a
                            className="thumb-link"
                            title=""
                            data-image-index={singleMediaIndex}
                            onClick={() => { setFeaturedMediaIndex(singleMediaIndex) }}
                          >
                            <img
                              src={singleMedia}
                              width="75"
                              height="75"
                              alt=""
                              onLoad={(event) => {
                                // console.log('onLoad event', event)
                              }}
                              onError={(event) => {
                                // console.log('onError singleMediaIndex, event', singleMediaIndex, event)
                                // console.log('onError selectedOptions', selectedOptions)
                                if (singleMediaIndex === 1) {
                                  setIsFirstUnavailable(true)
                                }
                                else {
                                  // console.log('Before setting media isFirstUnavailable', isFirstUnavailable)
                                  setAllMedias(prevMedias => {
                                    const newMedias = [...prevMedias]
                                    newMedias[singleMediaIndex] = ""
                                    return [
                                      ...newMedias
                                    ]
                                  })
                                }
                              }}
                            />
                          </a>
                        </li>
                        :
                        <li
                          className="video-thumb-container"
                          onClick={() => { setFeaturedMediaIndex(singleMediaIndex) }}
                        >
                          <div className="video-thumb-overlay"></div>
                          <img src={allMedias[0]} />
                        </li>
                      )
                    }
                  </>
                )
              })}

            </ul>
          </>
          // ,
          // document.querySelector('#jewelry-builder-app-media-wrapper')
          // )
        }
      </div>

      <div id="jewelry-builder-app-product-options-wrapper">

        {/* Vendor */}
        {
          !!productInfo?.product_vendor &&
          <p>{productInfo.product_vendor}</p>
        }

        {/* Title */}
        <h1>{productInfo.product_title}</h1>

        <fieldset>
          <div className="price price--large price--sold-out price--show-badge">
            <div className="price__container">
              <div className="price__regular">
                <span className="visually-hidden visually-hidden--inline">Regular price</span>
                <span className="price-item price-item--regular">
                  {/* Rs. {finalProductPrice} */}
                  Price: {i18n.formatCurrency(finalProductPrice, {
                    currency: currency,
                    form: 'explicit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </fieldset>

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
          <button type="submit" disabled={isDisabled} onClick={handleAddToCart}>
            Add to cart
          </button>
        </fieldset>

        {
          !!metaFieldData && !!metaFieldData?.description &&
          <fieldset dangerouslySetInnerHTML={{ __html: metaFieldData.description }}>
          </fieldset>
        }

        <fieldset>
          <button className="rca-share__button" onClick={() => {
            navigator.share({
              url: location.href,
              title: document.title
            })
          }}>
            <svg width="13" height="12" viewBox="0 0 13 12" class="icon icon-share" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <path d="M1.625 8.125V10.2917C1.625 10.579 1.73914 10.8545 1.9423 11.0577C2.14547 11.2609 2.42102 11.375 2.70833 11.375H10.2917C10.579 11.375 10.8545 11.2609 11.0577 11.0577C11.2609 10.8545 11.375 10.579 11.375 10.2917V8.125" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.14775 1.27137C6.34301 1.0761 6.65959 1.0761 6.85485 1.27137L9.56319 3.9797C9.75845 4.17496 9.75845 4.49154 9.56319 4.6868C9.36793 4.88207 9.05135 4.88207 8.85609 4.6868L6.5013 2.33203L4.14652 4.6868C3.95126 4.88207 3.63468 4.88207 3.43942 4.6868C3.24415 4.49154 3.24415 4.17496 3.43942 3.9797L6.14775 1.27137Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.5 1.125C6.77614 1.125 7 1.34886 7 1.625V8.125C7 8.40114 6.77614 8.625 6.5 8.625C6.22386 8.625 6 8.40114 6 8.125V1.625C6 1.34886 6.22386 1.125 6.5 1.125Z" fill="currentColor"></path>
            </svg>
            Share
          </button>
        </fieldset>
      </div>




    </div>
  )
}

export default App