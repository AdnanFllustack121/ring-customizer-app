import { existsSync } from "fs"
import { unlink, writeFile } from "fs/promises"
import { apiVersion } from "./shopify.server"
import axios from "axios"



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

export const generateVariations = (options) => {
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
        variant_title = variant_title.join(' / ')
        variations.push({
          variant_title,
          variant_options,
          variant_price: ''
        })
        return
      }

      for (const value of options[currentIndex].option_values) {
        currentVariation.push({
          option_id: options[currentIndex].option_id,
          ...value
        })
        generate(currentIndex + 1, currentVariation)
        currentVariation.pop()
      }
    }

    generate(0, [])

    return variations
}