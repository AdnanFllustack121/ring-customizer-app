import { json } from "@remix-run/node"
import { Products, Session } from "../db.server"
import { createFile, makeid, shopifyRest } from "../utils"
import shopify, { apiVersion, authenticate } from "../shopify.server"

export const loader = async ({ params, request }) => {

    const { storefront, liquid } = await authenticate.public.appProxy(request)

    console.log('storefront', storefront)

    if (!storefront) {
        return new Response();
    }

    const product = await Products.findOne({
        product_id: `gid://shopify/Product/${params.product_id}`
    })

    return json({
        success: !!product,
        data: product
    })
}

export const action = async ({ params, request }) => {

    const appProxyVars = await authenticate.public.appProxy(request)
    console.log('appProxyVars', appProxyVars)

    const { session, storefront, liquid } = appProxyVars
    if (!storefront) {
        return new Response();
    }

    switch (request.method) {
        case "POST":

            const payload = await request.json()

            let image_path = ''
            if (!!payload?.image) {
                // image_path = await createFile('image_path.png', payload.image)
                // image_path = payload.image.replace(/^data:image\/png;base64,/, "")
                image_path = payload.image
            }

            if (!payload?.metafields) {
                return json({
                    success: false
                })
            }

            // 
            let params_product_id = params.product_id

            if (!!payload?.relatedToId) {
                params_product_id = payload.relatedToId

                // return json({
                //     success: false,
                //     data: params_product_id,
                //     delete: params.product_id
                // })

                const deleteProduct = await shopifyRest({
                    session,
                    method: "DELETE",
                    path: `products/${params.product_id}.json`,
                })
                console.log('deleteProduct', deleteProduct)

            }

            // 

            const getProduct = await shopifyRest({
                session,
                path: `products/${params_product_id}.json`,
            })
            // console.log('getProduct', getProduct)

            const productCustomizationData = await Products.findOne({
                product_id: `gid://shopify/Product/${params_product_id}`
            })
            console.log('productCustomizationData', productCustomizationData)

            if (
                !!getProduct &&
                ('product' in getProduct) &&
                !!productCustomizationData
            ) {
                const product_data = getProduct.product
                console.log('product_data', product_data)

                const total_price = parseFloat(+payload.final_product_price).toFixed(2)
                console.log('total_price', total_price)

                const productCreateResponse = await shopifyRest({
                    session,
                    method: "POST",
                    path: 'products.json',
                    body: {
                        "product": {
                            "title": `${product_data.title} - Custom Builder - SKU ${product_data.variants[0].sku} ${makeid(24)}`,
                            "body_html": product_data.body_html,
                            "vendor": product_data.vendor,
                            "product_type": "custom_ordered",
                            // "status": "draft"
                            "tags": `related_to_${product_data.id}`,
                            "images": [{
                                // "attachment": image_path
                                "src": image_path
                            }],
                            "metafields": [
                                {
                                    "key": "hidden",
                                    "value": 1,
                                    "type": "number_integer",
                                    "namespace": "seo"
                                },
                                {
                                    "key": "related_to",
                                    "value": product_data.id,
                                    "type": "number_integer",
                                    "namespace": "jewelrybuilderapp"
                                },
                                {
                                    "key": "related_to_sku",
                                    "value": product_data.variants[0].sku,
                                    "type": "single_line_text_field",
                                    "namespace": "jewelrybuilderapp"
                                },
                                {
                                    "key": "selectedOptions",
                                    "value": JSON.stringify(payload.selectedOptions),
                                    "type": "json",
                                    "namespace": "jewelrybuilderapp"
                                },

                                {
                                    "key": "metalWeight",
                                    "value": payload.metafields.metalWeight,
                                    "type": "number_decimal",
                                    "namespace": "jewelrybuilderapp"
                                },
                                {
                                    "key": "smallStoneWeight",
                                    "value": payload.metafields.smallStoneWeight,
                                    "type": "number_decimal",
                                    "namespace": "jewelrybuilderapp"
                                },
                                {
                                    "key": "sideStoneValue",
                                    "value": payload.metafields.sideStoneValue,
                                    "type": "number_decimal",
                                    "namespace": "jewelrybuilderapp"
                                },
                                {
                                    "key": "premium",
                                    "value": payload.metafields.premium,
                                    "type": "number_decimal",
                                    "namespace": "jewelrybuilderapp"
                                }
                            ],
                            "variants": [{
                                price: total_price
                            }]
                        }
                    }
                })
                console.log('productCreateResponse', productCreateResponse)

                if (
                    'product' in productCreateResponse &&
                    !!productCreateResponse.product &&
                    'variants' in productCreateResponse.product &&
                    !!productCreateResponse.product.variants &&
                    !!productCreateResponse.product.variants.length
                ) {
                    const variant = productCreateResponse.product.variants[productCreateResponse.product.variants.length - 1]
                    return json({
                        success: true,
                        data: variant.id
                    })
                }

            }

          break;


        case "PATCH":
            // const payloadOfUpdate = await request.json()
            // console.log('payloadOfUpdate', payloadOfUpdate)

            // if (!payloadOfUpdate?.selectedOptions) {
            //     return json({
            //         success: false
            //     })
            // }

            // const getProductToUpdate = await shopifyRest({
            //     session,
            //     path: `products/${params.product_id}.json`,
            // })
            // console.log('getProductToUpdate', getProductToUpdate)

            // if (
            //     !!getProductToUpdate &&
            //     ('product' in getProductToUpdate)
            // ) {
            //     const product_data = getProductToUpdate.product

            //     const total_price = parseFloat(+payloadOfUpdate.final_product_price).toFixed(2)

            //     const bodyToUpdate = {
            //         "product": {
            //             "id": product_data.id,
            //             // "metafields": [
            //             //     {
            //             //         "key": "selectedOptions",
            //             //         "value": JSON.stringify(payloadOfUpdate.selectedOptions),
            //             //         "type": "json",
            //             //         "namespace": "jewelrybuilderapp"
            //             //     },
            //             // ],
            //             "variants": [{
            //                 id: product_data.variants[0].id,
            //                 price: total_price
            //             }]
            //         }
            //     }

            //     console.log('bodyToUpdate', bodyToUpdate)

            //     const productCreateResponse = await shopifyRest({
            //         session,
            //         method: "PUT",
            //         path: `products/${product_data.id}.json`,
            //         body: bodyToUpdate
            //     })
            //     console.log('productCreateResponse', productCreateResponse)

            //     if (
            //         'product' in productCreateResponse &&
            //         !!productCreateResponse.product &&
            //         'variants' in productCreateResponse.product &&
            //         !!productCreateResponse.product.variants &&
            //         !!productCreateResponse.product.variants.length
            //     ) {
            //         const variant = productCreateResponse.product.variants[productCreateResponse.product.variants.length - 1]
            //         return json({
            //             success: true,
            //             data: variant.id
            //         })
            //     }

                
            // }

          break;

        case "DELETE":
          break;

        default:
          break;
    }

    return json({
        success: false
    })
}