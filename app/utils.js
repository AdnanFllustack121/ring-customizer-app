import { existsSync } from "fs"
import { unlink, writeFile } from "fs/promises"
import { apiVersion } from "./shopify.server"
import axios from "axios"

import productTypes from "../json/productTypes.json";
import optionsJson from "../json/options.json";


export const deleteFile = async (filePath) => {
    const uploadsPath = `${process.cwd()}/public/`
    if (existsSync(uploadsPath + filePath)) {
        await unlink(uploadsPath + filePath)
    }
    return true
}

export const createFile = async (filePathWithName, base64Data) => {
    const uploadsPath = `${process.cwd()}/public/`
    const newBase64Data = base64Data.replace(/^data:image\/png;base64,/, "")
    const uploadPath = `${uploadsPath}uploads/products/${filePathWithName}`
    await writeFile(uploadPath, newBase64Data, 'base64')
    if (existsSync(uploadPath)) {
        return uploadPath
    } else {
        return false
    }
}

export const authenticateProxyRoute = async (request) => {
    if (
        !!request.headers.get('x-force-upstream') &&
        (request.headers.get('x-force-upstream') === 'app_proxy_pool') &&
        !!request.headers.get('x-shop-domain')
    ) {
        return true
    } else {
        throw new Error("Oh no! Something went wrong!")
    }
}

export const shopifyRest = async ({ session, method = "GET", path, body }) => {
    try {
        const options = {
            method: method,
            headers: {
                'X-Shopify-Access-Token': session.accessToken,
                'Content-Type': 'application/json'
            },
        }
        if (!!body) {
            options.body = JSON.stringify(body)
        }
        return await fetch(`https://${session.shop}/admin/api/${apiVersion}/${path}`, options).then((res) => res.json())
    } catch (error) {
        console.log('shopifyRest error', error)
        return error
    }
}

export const shopifyGraphQL = async ({ session, query }) => {
    try {
        // const options = {
        //     method: "POST",
        //     headers: {
        //         'X-Shopify-Access-Token': session.accessToken,
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.parse(query)
        // }
        // return await fetch(`https://${session.shop}/admin/api/${apiVersion}/graphql.json`, options).then((res) => res.json())
        const options = {
            url: `https://${session.shop}/admin/api/${apiVersion}/graphql.json`,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': 'shpua_aeca6e07882718be70c9f559ce02efcb'
            },
            data: {
                query: query
            }
        }
        return await axios(options)

    } catch (error) {
        console.log('shopifyGraphQL error', error)
        return error
    }
}

export const makeid = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}


export const saveTheProductBasicData = () => {

}


export const generateMedias = ({ options: productOptions, product_sku: productSku, product_type, shop }) => {
    console.log('generateMedias productOptions, productSku, product_type', productOptions, productSku, product_type)

    // 
    const options = productOptions.filter(po => !!optionsJson.find(oj => oj.slug === po.option_slug)?.changeMedia)
    console.log('options', options)
    // 

    const mediaRecords = []

    // Helper function to recursively generate mediaRecords
    function generate(currentIndex, currentVariation) {
        console.log('currentVariation', JSON.stringify(currentVariation))
      if (currentIndex === options.length) {
        let variant_title = []
        const product_options = currentVariation.map(cv => {
          variant_title.push(cv.option_value_title)

            console.log('cv', cv)

          return {
            option_id: cv.option_id,
            option_slug: cv.option_slug,
            option_value_id: cv.option_value_id,
            option_value_title: cv.option_value_title
          }
        })
        if (product_options.length) {

            let media_image_paths = []

            // 
            let media_image_path = ''
            if (!!productSku) {
                const onlySkuNumber = productSku

                const productTypeObj = productTypes.find(pt => pt.productType === product_type)
                console.log('productTypeObj', productTypeObj)

                if (productTypeObj) {
                    //                    |-----------------------------------------------File Path---------------------------------------------------|------SKU------|-|--------ProductType_Short----------|
                    // let final_media_url = `https://kattdiamonds.com/media/catalog/product/${productTypeObj.productType.toLowerCase()}/${onlySkuNumber}/${onlySkuNumber}_${productTypeObj.ProductType_Short}_`
                    let final_media_url = `https://${shop}/cdn/shop/files/${onlySkuNumber}_${productTypeObj.ProductType_Short}_`

                    let final_media_video_url = `https://kattdiamonds.com/media/catalog/product/${productTypeObj.productType.toLowerCase()}/${onlySkuNumber}/${onlySkuNumber}_${productTypeObj.ProductType_Short}_`

                    console.log('final_media_url', final_media_url, product_options)

                    const option_value_titles = product_options.map(po => po.option_value_title)
                    // console.log('option_value_titles', option_value_titles)

                    const metalTypeObj = optionsJson.find(oj => oj.slug === 'metal_type')
                    const metal_type_product_option = product_options.find(po => po.option_slug === 'metal_type')
                    const metalTypeValueObj = metalTypeObj.values.find(metalTypeValue => {
                        return metalTypeValue.optionValueTitle === metal_type_product_option.option_value_title
                    })
                    // console.log('metalTypeValueObj', metalTypeValueObj)

                    if (metalTypeValueObj) {
                        final_media_url += `${metalTypeValueObj.optionValue_4Pic}_04_`

                        // Center Stone Shape
                        const centerStoneShapeObj = optionsJson.find(oj => oj.slug === 'center_stone_shape')
                        const center_stone_shape_product_option = product_options.find(po => po.option_slug === 'center_stone_shape')
                        if (center_stone_shape_product_option) {                            
                            const centerStoneShapeValueObj = centerStoneShapeObj.values.find(centerStoneShapeValue => {
                                return centerStoneShapeValue.optionValueTitle === center_stone_shape_product_option.option_value_title
                            })
                            if (centerStoneShapeValueObj) {
                                final_media_url += `${centerStoneShapeValueObj.optionValue_Short}-`
                            } else {
                                final_media_url += `na-`
                            }
                        } else {
                            final_media_url += `na-`
                        }
                        // Center Stone Shape END

                        // Center Stone Type
                        const centerStoneTypeObj = optionsJson.find(oj => oj.slug === 'center_stone_type')
                        const center_stone_type_product_option = product_options.find(po => po.option_slug === 'center_stone_type')
                        if (center_stone_type_product_option) {
                            const centerStoneTypeValueObj = centerStoneTypeObj.values.find(centerStoneTypeValue => {
                                return centerStoneTypeValue.optionValueTitle === center_stone_type_product_option.option_value_title
                            })
                            if (centerStoneTypeValueObj) {
                                final_media_url += `${centerStoneTypeValueObj.optionValue_4Pic}_`
                            } else {
                                final_media_url += `na_`
                            }
                        } else {
                            final_media_url += `na_`
                        }
                        // Center Stone Type END
                        
                        ////////////////////////

                        // Side Stone Shape
                        const sideStoneShapeObj = optionsJson.find(oj => oj.slug === 'side_stone_shape')
                        const side_stone_shape_product_option = product_options.find(po => po.option_slug === 'side_stone_shape')
                        if (side_stone_shape_product_option) {
                            const sideStoneShapeValueObj = sideStoneShapeObj.values.find(sideStoneShapeValue => {
                                return sideStoneShapeValue.optionValueTitle === side_stone_shape_product_option.option_value_title
                            })
                            if (sideStoneShapeValueObj) {
                                final_media_url += `${sideStoneShapeValueObj.optionValue_Short}-`
                            } else {
                                final_media_url += `na-`
                            }
                        } else {
                            final_media_url += `na-`
                        }
                        // Side Stone Shape END

                        // Side Stone Type
                        const sideStoneTypeObj = optionsJson.find(oj => oj.slug === 'side_stone_type')
                        const side_stone_type_product_option = product_options.find(po => po.option_slug === 'side_stone_type')
                        if (side_stone_type_product_option) {
                            const sideStoneTypeValueObj = sideStoneTypeObj.values.find(sideStoneTypeValue => {
                                return sideStoneTypeValue.optionValueTitle === side_stone_type_product_option.option_value_title
                            })
                            if (sideStoneTypeValueObj) {
                                final_media_url += `${sideStoneTypeValueObj.optionValue_4Pic}_`
                            } else {
                                final_media_url += `na_`
                            }
                        } else {
                            final_media_url += `na_`
                        }
                        // Side Stone Type END

                        ////////////////////////

                        // Small Stone Shape
                        const smallStoneShapeObj = optionsJson.find(oj => oj.slug === 'small_stone_shape')
                        const small_stone_shape_product_option = product_options.find(po => po.option_slug === 'small_stone_shape')
                        if (small_stone_shape_product_option) {
                            const smallStoneShapeValueObj = smallStoneShapeObj.values.find(smallStoneShapeValue => {
                                return smallStoneShapeValue.optionValueTitle === small_stone_shape_product_option.option_value_title
                            })
                            if (smallStoneShapeValueObj) {
                                final_media_url += `${smallStoneShapeValueObj.optionValue_Short}-`
                            } else {
                                final_media_url += `na-`
                            }
                        } else {
                            final_media_url += `na-`
                        }
                        // Small Stone Shape END

                        // Small Stone Type
                        const smallStoneTypeObj = optionsJson.find(oj => oj.slug === 'small_stone_type')
                        const small_stone_type_product_option = product_options.find(po => po.option_slug === 'small_stone_type')
                        if (small_stone_type_product_option) {
                            const smallStoneTypeValueObj = smallStoneTypeObj.values.find(smallStoneTypeValue => {
                                return smallStoneTypeValue.optionValueTitle === small_stone_type_product_option.option_value_title
                            })
                            if (smallStoneTypeValueObj) {
                                final_media_url += `${smallStoneTypeValueObj.optionValue_4Pic}_`
                            } else {
                                final_media_url += `na_`
                            }
                        } else {
                            final_media_url += `na_`
                        }
                        // Small Stone Type END

                        ////////////////////////


                        // All 6 images
                        for (let index = 1; index <= 6; index++) {
                            media_image_paths.push(`${final_media_url}0${index}.jpg`)
                        }


                        // Video START
                        media_image_paths.push(`${final_media_video_url}36.mp4`)
                        // Video END


                        final_media_url += '01.jpg'
                        console.log('final_media_url', final_media_url)
    
                        media_image_path = final_media_url
                    }
                }
            }
            // 

            mediaRecords.push({
              media_id: makeid(24),
              media_title: variant_title.join(' / '),
              product_options,
              media_image_path,
              media_image_paths
            //   variant_price: ''
            })
        }
        return
      }

      if (!options?.[currentIndex]?.option_values?.length) {
        return
      }

      for (const option_value of options[currentIndex].option_values) {
        // console.log('currentVariation', JSON.stringify(currentVariation))
        // console.log('options[currentIndex], option_value', options[currentIndex], option_value)

        // Extra START
        const showOnlyWhenTesting = optionsJson.find(oj => !!oj?.showOnlyWhen && (oj.slug === options[currentIndex].option_slug))
        let pushOrNot = true
        if (!!showOnlyWhenTesting) {
            const showOnlyWhenOptionSlug = showOnlyWhenTesting.showOnlyWhen.optionSlug
            const showOnlyWhenOptionValueSlug = showOnlyWhenTesting.showOnlyWhen.optionValueSlug
            const condition = currentVariation.find(cv => (cv.option_slug === showOnlyWhenOptionSlug && cv.option_value_slug === showOnlyWhenOptionValueSlug))
            if (!condition) {
                pushOrNot = false
            }
        }
        // Extra END


        // console.log('before currentVariation', JSON.stringify(currentVariation))


        if (pushOrNot) {
            currentVariation.push({
              option_id: options[currentIndex].option_id,
              option_slug: options[currentIndex].option_slug,
              ...option_value
            })
        }
        generate(currentIndex + 1, currentVariation)
        // if (pushOrNot) {
            currentVariation.pop()
        // }
        // console.log('after currentVariation', JSON.stringify(currentVariation))
      }

    }

    generate(0, [])

    // console.log('mediaRecords', mediaRecords)

    return mediaRecords
}



export const generateVariations = (productOptions) => {

    // 
    const options = productOptions.filter(po => !!optionsJson.find(oj => oj.slug === po.option_slug)?.changeMedia)
    // 

    const variations = []

    // Helper function to recursively generate variations
    function generate(currentIndex, currentVariation) {
      if (currentIndex === options.length) {
        let variant_title = []
        const variant_options = currentVariation.map(cv => {
          variant_title.push(cv.option_value_title)
          return {
            option_id: cv.option_id,
            option_value_id: cv.option_value_id,
            option_value_title: cv.option_value_title
          }
        })
        if (variant_options.length) {
            // console.log('variant_options', variant_options)
            variations.push({
              variant_id: makeid(24),
              variant_title: variant_title.join(' / '),
              variant_options,
              variant_price: ''
            })
        }
        return
      }

      if (!options?.[currentIndex]?.option_values?.length) {
        return
      }

      for (const option_value of options[currentIndex].option_values) {
        // console.log('currentVariation', JSON.stringify(currentVariation))
        // console.log('options[currentIndex], option_value', options[currentIndex], option_value)

        // Extra START
        const showOnlyWhenTesting = optionsJson.find(oj => !!oj?.showOnlyWhen && (oj.slug === options[currentIndex].option_slug))
        let pushOrNot = true
        if (!!showOnlyWhenTesting) {
            const showOnlyWhenOptionSlug = showOnlyWhenTesting.showOnlyWhen.optionSlug
            const showOnlyWhenOptionValueSlug = showOnlyWhenTesting.showOnlyWhen.optionValueSlug
            const condition = currentVariation.find(cv => (cv.option_slug === showOnlyWhenOptionSlug && cv.option_value_slug === showOnlyWhenOptionValueSlug))
            if (!condition) {
                pushOrNot = false
            }
        }
        // Extra END


        // console.log('before currentVariation', JSON.stringify(currentVariation))


        if (pushOrNot) {
            currentVariation.push({
              option_id: options[currentIndex].option_id,
              option_slug: options[currentIndex].option_slug,
              ...option_value
            })
        }
        generate(currentIndex + 1, currentVariation)
        // if (pushOrNot) {
            currentVariation.pop()
        // }
        // console.log('after currentVariation', JSON.stringify(currentVariation))
      }

    }

    generate(0, [])

    // console.log('variations', variations)

    return variations
}