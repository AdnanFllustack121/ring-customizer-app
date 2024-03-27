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


export const generateMedias = (productOptions, productSku) => {
    console.log('productOptions', productOptions)

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
          return {
            option_id: cv.option_id,
            option_value_id: cv.option_value_id,
            option_value_title: cv.option_value_title
          }
        })
        if (product_options.length) {

            // 
            let media_image_path = ''
            if (!!productSku) {
                const productSkuWithSlash = productSku.replace('_', '/')
                const productSkuArr = productSku.split('_')

                const onlyProductTypeLower = productSkuArr[0]
                const onlySkuNumber = productSkuArr[1]

                const productType = onlyProductTypeLower.charAt(0).toUpperCase() + onlyProductTypeLower.slice(1)
                const productTypeObj = productTypes.find(pt => pt.productType === productType)
                console.log('productTypeObj', productTypeObj)

                if (productTypeObj) {
                    let final_media_url = `https://kattdiamonds.com/media/catalog/product/${productSkuWithSlash}/${onlySkuNumber}_${productTypeObj.ProductType_Short}_`

                    console.log('final_media_url', final_media_url, product_options)

                    const option_value_titles = product_options.map(po => po.option_value_title)
                    console.log('option_value_titles', option_value_titles)

                    const metalTypeObj = optionsJson.find(oj => oj.slug === 'metal_type')
                    const metalTypeValueObj = metalTypeObj.values.find(metalTypeValue => option_value_titles.includes(metalTypeValue.optionValueTitle))

                    if (metalTypeValueObj) {
                        final_media_url += `${metalTypeValueObj.optionValue_4Pic}_04_`

                        // Center Stone Shape
                        const centerStoneShapeObj = optionsJson.find(oj => oj.slug === 'center_stone_shape')
                        const centerStoneShapeValueObj = centerStoneShapeObj.values.find(centerStoneShapeValue => option_value_titles.includes(centerStoneShapeValue.optionValueTitle))
                        final_media_url += `${centerStoneShapeValueObj.optionValue_Short}-`

                        // Center Stone Type
                        const centerStoneTypeObj = optionsJson.find(oj => oj.slug === 'center_stone_type')
                        const centerStoneTypeValueObj = centerStoneTypeObj.values.find(centerStoneTypeValue => option_value_titles.includes(centerStoneTypeValue.optionValueTitle))
                        final_media_url += `${centerStoneTypeValueObj.optionValue_4Pic}_`
                        
                        ////////////////////////

                        // Side Stone Shape
                        // const sideStoneShapeObj = optionsJson.find(oj => oj.slug === 'side_stone_shape')
                        // const sideStoneShapeValueObj = sideStoneShapeObj.values.find(sideStoneShapeValue => option_value_titles.includes(sideStoneShapeValue.optionValueTitle))
                        // console.log('sideStoneShapeValueObj', sideStoneShapeValueObj)
                        // final_media_url += `${sideStoneShapeValueObj.optionValue_Short}-`
                        
                        // Side Stone Type
                        
                        final_media_url += 'na-na_'
                        ////////////////////////

                        // Small Stone Shape

                        // Small Stone Type

                        final_media_url += 'na-na_'
                        ////////////////////////

                        final_media_url += '01.jpg'
                        console.log('final_media_url', final_media_url)

                        media_image_path = final_media_url
                    }

                    // let metal_type_4_pic_short = 
                }
            }
            // 


            mediaRecords.push({
              media_id: makeid(24),
              media_title: variant_title.join(' / '),
              product_options,
              media_image_path
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