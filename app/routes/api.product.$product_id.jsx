import { json } from "@remix-run/node"
import { Products, Session } from "../db.server"
import { createFile, makeid, shopifyRest, shopifyGraphQL } from "../utils"
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

                const productDeleteQuery = `
                    mutation {
                        productDelete(input: {id: "gid://shopify/Product/${params.product_id}"}) {
                            deletedProductId
                            userErrors {
                            field
                            message
                            }
                        }
                    }
                `

                const deleteProduct = await shopifyGraphQL({
                    session,
                    query: productDeleteQuery,
                })

            }

            const productQuery = `
                query {
                    node(id: "gid://shopify/Product/${params_product_id}") {
                        id
                        ... on Product {
                            title
                            bodyHtml
                            vendor
                            productType
                            createdAt
                            handle
                            updatedAt
                            publishedAt
                            templateSuffix
                            tags
                            status
                            variants(first:20) {
                                edges {
                                    node {
                                        id
                                        title
                                        price
                                        position
                                        inventoryPolicy
                                        compareAtPrice
                                        createdAt
                                        updatedAt
                                        taxable
                                        barcode
                                        sku
                                        inventoryItem{id}
                                        inventoryQuantity
                                    }
                                }
                            }
                            options{
                                id
                                values
                                name
                                position
                            }
                            images(first:5) {
                                edges {
                                    node {
                                        id
                                        altText
                                        width
                                        height
                                        url
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const getProduct = await shopifyGraphQL({
                session,
                query: productQuery,
            })
            // console.log('getProduct', getProduct)

            const productCustomizationData = await Products.findOne({
                product_id: `gid://shopify/Product/${params_product_id}`
            })

            if (
                !!getProduct &&
                ('data' in getProduct) &&
                !!productCustomizationData
            ) {
                const product_data = getProduct.data.node
                const total_price = parseFloat(+payload.final_product_price).toFixed(2)

                const productCreateQuery = `
                    mutation createProductMetafields($input: ProductInput!) {
                        productCreate(input: $input) {
                            product {
                                id
                                metafields(first: 3) {
                                    edges {
                                        node {
                                            id
                                            namespace
                                            key
                                            value
                                        }
                                    }
                                }
                            }
                            userErrors {
                                message
                                field
                            }
                        }
                    }
                `;

                const productCreatevariables = {
                    input: {
                        title: `${product_data.title} - Custom Builder - SKU ${product_data.variants.edges[0].node.sku}`,

                        vendor: product_data.vendor,
                        productType: "custom_ordered",
                        tags: `related_to_${product_data.id}`,
                        // images: [
                        //     {
                        //         // "attachment": image_path
                        //         "src": image_path
                        //     }
                        // ],

                        metafields: [
                            {
                                key: "hidden",
                                value: "1",
                                type: "number_integer",
                                namespace: "seo",
                            },
                            {
                                key: "related_to",
                                value: (product_data.id).split("/")[4],
                                type: "number_integer",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "related_to_sku",
                                value: product_data?.variants?.edges[0]?.node.sku,
                                type: "single_line_text_field",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "selectedOptions",
                                value: JSON.stringify(payload.selectedOptions),
                                type: "json",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "metalWeight",
                                value: String(payload.metafields.metalWeight),
                                type: "number_decimal",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "smallStoneWeight",
                                value: String(payload.metafields.smallStoneWeight),
                                type: "number_decimal",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "sideStoneValue",
                                value: String(payload.metafields.sideStoneValue),
                                type: "number_decimal",
                                namespace: "jewelrybuilderapp"
                            },
                            {
                                key: "premium",
                                value: String(payload.metafields.premium),
                                type: "number_decimal",
                                namespace: "jewelrybuilderapp"
                            }
                        ]
                    }
                };

                const productCreateResponse = await shopifyGraphQL({
                    session,
                    query: productCreateQuery,
                    variables: productCreatevariables
                })
                // console.log('productCreateResponse', productCreateResponse);
                const productCreateID = productCreateResponse.data.productCreate.product.id
                const publicationIdQuery = `
                    query {
                        publications(first:10) {
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                `;

                const getPublicationId = await shopifyGraphQL({
                    session,
                    query: publicationIdQuery,
                })

                // console.log("getPublicationId === ", getPublicationId);
                const publicationId = (getPublicationId.data.publications.edges[0].node.id).split("/")[4];
                if (publicationId) {

                    const productPublishQuery = `
                        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
                            publishablePublish(id: $id, input: $input) {
                                publishable {
                                    availablePublicationsCount {
                                        count
                                    }
                                    resourcePublicationsCount {
                                        count
                                    }
                                }
                                shop {
                                    publicationCount
                                }
                                userErrors {
                                    field
                                    message
                                }
                            }
                        }
                    `;

                    const publishVariables = {
                        id: `${productCreateID}`,
                        input: [
                        {
                            publicationId: `gid://shopify/Publication/${publicationId}`
                        }
                        ]
                    };

                    const publishProduct = await shopifyGraphQL({
                        session,
                        query: productPublishQuery,
                        variables: publishVariables
                    });
                    // console.log("publishProduct ======= ", publishProduct);

                    const publishProductResponse = publishProduct.data.publishablePublish.publishable

                    if (publishProductResponse.availablePublicationsCount || publishProductResponse.resourcePublicationsCount) {
                        const productVariantQuery = `
                        query {
                            product(id: "${productCreateID}") {
                                id
                                title
                                variants(first: 10) {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }`

                        const findVariant = await shopifyGraphQL({
                            session,
                            query: productVariantQuery,
                        });
                        // console.log("findVariant ===== ", findVariant);
                        const varientID = findVariant.data?.product?.variants?.edges[0]?.node?.id

                        if (varientID) {
                            const updatePriceQuery = `
                                mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                                    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                                        product {
                                            id
                                        }
                                        productVariants {
                                            id
                                            price
                                        }
                                        userErrors {
                                            field
                                            message
                                        }
                                    }
                                }
                            `;

                            const updatePriceVariable = {
                                productId: `${productCreateID}`,
                                variants: [
                                    {
                                        id: `${varientID}`,
                                        price: total_price
                                    }
                                ]
                            };

                            const updateVariantPrice = await shopifyGraphQL({
                                session,
                                query: updatePriceQuery,
                                variables: updatePriceVariable
                            });
                            // console.log("updateVariantPrice =======", updateVariantPrice);

                            const updateVarientData = updateVariantPrice.data.productVariantsBulkUpdate.productVariants
                            if (updateVarientData.length) {
                                return json({
                                success: true,
                                data: varientID
                                })
                            }
                        }
                    }
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