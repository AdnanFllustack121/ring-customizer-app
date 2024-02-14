import { json } from "@remix-run/node"
import { Products, Session } from "../db.server"
import { authenticateProxyRoute, createFile, makeid, shopifyRest } from "../utils"
import { apiVersion } from "../shopify.server"

export const loader = async ({ params, request }) => {

    await authenticateProxyRoute(request)

    const product = await Products.findOne({
        product_id: `gid://shopify/Product/${params.product_id}`
    })

    return json({
        success: !!product,
        data: product
    })
}

export const action = async ({ params, request }) => {

    await authenticateProxyRoute(request)

    switch (request.method) {
        case "POST":

        const payload = await request.json()

        let image_path = ''
        if (!!payload?.image) {
            // image_path = await createFile('image_path.png', payload.image)
            image_path = payload.image.replace(/^data:image\/png;base64,/, "")
        }

        if (!!image_path) {
            const shop_domain = request.headers.get('x-shop-domain')
            const session = await Session.findOne({ shop: shop_domain })

            const getProduct = await shopifyRest({
                session,
                path: `products/${params.product_id}.json`,
            })

            const productCustomizationData = await Products.findOne({
                product_id: `gid://shopify/Product/${params.product_id}`
            })
            console.log('productCustomizationData', productCustomizationData)

            if (
                !!getProduct &&
                ('product' in getProduct) &&
                !!productCustomizationData
            ) {
                const product_data = getProduct.product

                // console.log('payload.options', payload.options)
                let options_price = 0

                const payload_options = Object.keys(payload.options)
                for (let index = 0; index < payload_options.length; index++) {
                    const payload_option = payload.options[payload_options[index]]

                    const category = productCustomizationData.categories.find(cat => cat.category_id === payload_option.category_id)

                    const option = category.options.find(opt => opt.option_id === payload_option.option_id)

                    options_price += +option.option_price

                }
                console.log('options_price', options_price)

                const total_price = parseFloat(+product_data.variants[0].price + options_price).toFixed(2)

                console.log('total_price', total_price)

                const productCreateResponse = await shopifyRest({
                    session,
                    method: "POST",
                    path: 'products.json',
                    body: {
                        "product": {
                            "title": `${product_data.title} - Custom Builder - Customer's Product with option_price ${total_price} ID ${makeid(24)}`,
                            "body_html": product_data.body_html,
                            "vendor": `related_to_${product_data.id}`,
                            "product_type": "custom_ordered",
                            // "status": "draft"
                            "tags": `related_to_${product_data.id}`,
                            "images": [{
                                "attachment": image_path
                            }],
                            "metafields": [{
                                "key": "hidden",
                                "value": 1,
                                "type": "number_integer",
                                "namespace": "seo"
                            }],
                            "variants": [{
                                price: total_price
                            }]
                        }
                    }
                })

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

        }


        //   const formData = await request.formData()

        //   const product_id = formData.get("product_id")
        //   const product_title = formData.get("product_title")
    
        //   const doExists = await Products.findOne({ product_id })
        //   if (doExists) {
        //     return json({
        //       success: false,
        //       message: "Already Exists"
        //     })
        //   } else {
        //     const isProductCreated = await Products.create({
        //       product_id,
        //       product_title
        //     })

        //     return json({
        //       success: true,
        //       product: isProductCreated,
        //       message: "Success!"
        //     })
        //   }

          break;
    
        case "PATCH":
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