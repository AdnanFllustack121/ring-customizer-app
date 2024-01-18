import {
    BlockStack,
    Box,
    Button,
    DropZone,
    FormLayout,
    InlineStack,
    Layout,
    LegacyCard,
    LegacyStack,
    Page,
    Text,
    TextField,
    Thumbnail,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json, redirect, unstable_composeUploadHandlers, unstable_createFileUploadHandler, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { Products } from "../db.server";
import { useCallback, useEffect, useReducer, useState } from "react";

import CreatableSelect from "react-select/creatable";

import variantStyles from "~/styles/variant.css";
import { makeid } from "../utils";

export const links = () => [
    { rel: "stylesheet", href: variantStyles },
];

export const loader = async ({ params, request }) => {
    await authenticate.admin(request)

    console.log('variant loader params', params)

    const product = await Products.findById(params.product_id)

    const loaderResponse = {
        success: true,
        product
    }

    if ( !!params?.variant_id && params.variant_id != 'new' ) {
        loaderResponse.variant = product.variants.find(vrnt => vrnt.variant_id === params.variant_id)
    }

    return json(loaderResponse)
}

export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request)

    try {

        switch (request.method) {
            case "POST":
                const uploadHandlerToCreate = unstable_composeUploadHandlers(
                    unstable_createFileUploadHandler({
                        directory: 'public/uploads/files',
                        maxPartSize: 10000000,
                        file: ({ filename }) => filename,
                    }),
                    // parse everything else into memory
                    unstable_createMemoryUploadHandler()
                )
    
                const formDataToCreate = await unstable_parseMultipartFormData(
                    request,
                    uploadHandlerToCreate
                )
    
                const document_id = formDataToCreate.get("document_id")
                console.log('document_id', document_id)
                const variant_id = makeid(24)
                let variant_options = formDataToCreate.get("variant_options")
    
                variant_options = JSON.parse(variant_options)

                const variant_image_file = formDataToCreate.get('variant_image_file')
    
                console.log('variant_options', variant_options)
    
                const foundProduct = await Products.findById(document_id)
                console.log('foundProduct', foundProduct)

                const existingVariants = !!foundProduct?.variants ? foundProduct.variants : []

                console.log('existingVariants', existingVariants)

                const newVariant = {
                    variant_id,
                    variant_options
                }

                if (!!variant_image_file) {
                    newVariant.variant_image_path = `/uploads/files/${variant_image_file.name}`
                }

                const newVariants = [
                    ...existingVariants,
                    newVariant
                ]

                const isProductUpdated = await Products.findOneAndUpdate({
                    _id: document_id
                  }, {
                    variants: newVariants
                })
                console.log('isProductUpdated', isProductUpdated)

                return redirect(`/app/product/${foundProduct._id}`)
    
                break;

            case "PATCH":

                const uploadHandlerToUpdate = unstable_composeUploadHandlers(
                    unstable_createFileUploadHandler({
                        directory: 'public/uploads/files',
                        maxPartSize: 10000000,
                        file: ({ filename }) => filename,
                    }),
                    // parse everything else into memory
                    unstable_createMemoryUploadHandler()
                )

                const formDataToUpdate = await unstable_parseMultipartFormData(
                    request,
                    uploadHandlerToUpdate
                )

                const document_id_to_update = formDataToUpdate.get("document_id")
                const variant_id_to_update = formDataToUpdate.get("variant_id")
                let variant_options_to_update = formDataToUpdate.get("variant_options")
                variant_options_to_update = JSON.parse(variant_options_to_update)
                const variant_image_file_to_update = formDataToUpdate.get('variant_image_file')

                const foundProductToUpdate = await Products.findById(document_id_to_update)
                // console.log('foundProductToUpdate', foundProductToUpdate)

                const existingVariantsToUpdate = !!foundProductToUpdate?.variants ? foundProductToUpdate.variants : []
                // console.log('existingVariantsToUpdate', existingVariantsToUpdate)
                
                const foundProductVariantIndex = existingVariantsToUpdate.findIndex(vrnt => vrnt.variant_id == variant_id_to_update)
                // console.log('foundProductVariantIndex', foundProductVariantIndex)

                // console.log('existingVariantsToUpdate[foundProductVariantIndex].variant_image_path', existingVariantsToUpdate[foundProductVariantIndex].variant_image_path)
                const newVariantToUpdate = {
                    variant_id: variant_id_to_update,
                    variant_options: variant_options_to_update,
                    variant_image_path: existingVariantsToUpdate[foundProductVariantIndex].variant_image_path
                }

                if (variant_image_file_to_update != 'null') {
                    console.log('variant_image_file_to_update', typeof variant_image_file_to_update, variant_image_file_to_update)
                    newVariantToUpdate.variant_image_path = `/uploads/files/${variant_image_file_to_update.name}`
                }

                const newVariantsUpdated = [
                    ...existingVariantsToUpdate,
                ]
                newVariantsUpdated[foundProductVariantIndex] = newVariantToUpdate

                console.log('newVariantsUpdated', newVariantsUpdated)

                const isProductUpdatedVariants = await Products.findOneAndUpdate({
                    _id: document_id_to_update
                  }, {
                    variants: newVariantsUpdated
                })
                // console.log('isProductUpdatedVariants', isProductUpdatedVariants)
                return redirect(`/app/product/${foundProductToUpdate._id}`)
                break;

            case "DELETE":
                const formDataToDelete = await request.formData()

                const document_id_to_delete = formDataToDelete.get("document_id")
                const variant_id_to_delete = formDataToDelete.get("variant_id")

                const foundProductToDelete = await Products.findById(document_id_to_delete)

                const new_Variants = foundProductToDelete.variants.filter(vrnt => vrnt.variant_id != variant_id_to_delete)

                const isVariantDeleted = await Products.findOneAndUpdate({
                    _id: document_id_to_delete
                  }, {
                    variants: new_Variants
                })

                return redirect(`/app/product/${foundProductToDelete._id}`)

                break;
        }

    } catch (error) {
        console.log('variant action error', error)
    }


    return json({
        success: true
    })
}

const productDataReducer = (state, action) => {
    console.log('productDataReducer state, action', state, action)
    switch (action.type) {
      case "CLEAR":
        
        break;
    
      case "ADD":
        const action_option = action.option
        console.log('action_option', action_option)
  
        const new_state = {
          ...state,
          option_values: {
            ...state.option_values,
            [action_option]: [
              ...state.option_values[action_option],
              action.data
            ]
          }
        }
        return { ...new_state }
  
      case "REMOVE":
  
        let newOptions = state.option_values[action.option].filter(soao => soao.name !== action.name)
  
        const new_state_after_removal = {
          ...state,
          option_values: {
            ...state.option_values,
            [action.option]: newOptions
          }
        }
  
        return { ...new_state_after_removal }
  
      default:
        const state_merge = { ...state, ...action }
        return state_merge
    }
}

const variantDataReducer = (state, action) => {
    switch (action.type) {
        case "CLEAR":
            
            break;
    
        default:
            return { ...state, ...action }
    }
}

export default function Variant() {

    const navigate = useNavigate()
    const params = useParams()
    const loaderData = useLoaderData()

    const submit = useSubmit()

    console.log('params', params)

    const [productData, dispatchProductData] = useReducer(productDataReducer, {
        id: '',
        product_id: '',
        product_title: '',
        product_image: '',
        product_price: '',
        options: [],
        variants: []
    })


    const [variantData, dispatchVariantData] = useReducer(variantDataReducer, {
        variant_id: '',
        variant_options: [],
        variant_image_file: null,
        variant_image_path: ''
    })

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => {
            dispatchVariantData({
                variant_image_file: acceptedFiles[0]
            })
        },
        [],
    );

    useEffect(() => {
        console.log('useEffect loaderData', loaderData)

        dispatchProductData({
            id: loaderData.product._id,
            product_id: loaderData.product.product_id,
            product_title: loaderData.product.product_title,
            options: !!loaderData?.product?.options ? loaderData.product.options : [],
        })

        if (!!loaderData?.variant) {
            dispatchVariantData({
                ...loaderData.variant
            })
        }

    }, [loaderData])


    const handleVariantSelectOptionChange = (optn_index, selected_option) => {
        console.log('handleVariantSelectOptionChange optn_index, selected_option', optn_index, selected_option)

        const newVariantData = {
            ...variantData
        }

        if (!!selected_option) {
            newVariantData.variant_options[optn_index] = {
                option_id: selected_option.optn.option_id,
                option_value_id: selected_option.value,
                option_value_title: selected_option.label
            }
        } else {
            newVariantData.variant_options[optn_index] = {}
        }

        console.log('newVariantData.variant_options', newVariantData.variant_options)

        dispatchVariantData(newVariantData)
    }


    const handleVariantSaveEvent = () => {

        console.log('handleVariantSaveEvent variantData', variantData)
        console.log('productData', productData)
        const formData = new FormData()

        if (!!variantData.variant_id) {
            formData.append('document_id', productData.id)
            formData.append('variant_id', variantData.variant_id)
            formData.append('variant_options', JSON.stringify(variantData.variant_options))
            formData.append("variant_image_file", variantData.variant_image_file)
            submit(formData, { replace: true, method: "PATCH", encType: "multipart/form-data" })
        } else {
            formData.append('document_id', productData.id)
            formData.append('variant_options', JSON.stringify(variantData.variant_options))
            formData.append("variant_image_file", variantData.variant_image_file)
            submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
        }
    }

    const handleVariantDeleteEvent = () => {
        console.log('handleVariantDeleteEvent variantData', variantData)

        const formData = new FormData()
        formData.append('document_id', productData.id)
        formData.append("variant_id", variantData.variant_id)
        submit(formData, { replace: true, method: "DELETE" })
    }

    console.log('productData', productData)
    console.log('variantData', variantData)

    return (
        <Page
            backAction={{
                content: '',
                url: `/app/product/${params.product_id}`
            }}
            title="Add variant"
            primaryAction={{
                content: !!variantData.variant_id ? 'Edit Variant' : 'Save Variant',
                onAction: handleVariantSaveEvent
            }}
            secondaryActions={[{
                content: 'Delete Variant',
                destructive: true,
                onAction: handleVariantDeleteEvent,
            }]}
        >
            <Layout>
                <Layout.Section variant="oneThird">
                    <LegacyCard title="Variants">
                        <div className="ezVmi">
                            {/* <Scrollable>
                                <ul id="variantsList" className="V3AvU">
                                    
                                </ul>
                            </Scrollable> */}
                        </div>
                    </LegacyCard>
                </Layout.Section>

                <Layout.Section>
                    <LegacyCard title="Options">
                        <Box padding="400">
                            <div className="blockStack-parent">
                                <BlockStack gap="400">
                                    {
                                        productData.options.map((optn, optn_index) => {
                                            return (
                                                !!optn?.option_values?.length &&
                                                <FormLayout key={optn.option_id}>
                                                    <label for={optn.option_id}>{optn.option_title}</label>
                                                    <CreatableSelect
                                                        id={optn.option_id}
                                                        key={optn.option_id}
                                                        // defaultValue={optn.option_values[0].option_value_id}
                                                        value={{
                                                            value: variantData?.variant_options[optn_index]?.option_value_id,
                                                            label: variantData?.variant_options[optn_index]?.option_value_title,
                                                        }}
                                                        onChange={(selected_option) => {
                                                            handleVariantSelectOptionChange(optn_index, selected_option)
                                                        }}
                                                        isLoading={false}
                                                        isClearable
                                                        isSearchable
                                                        options={optn.option_values.map(ov => {
                                                            const option_value = {
                                                                value: ov.option_value_id,
                                                                label: ov.option_value_title,
                                                                optn
                                                            }
                                                            return option_value
                                                        })}
                                                        placeholder={`Select ${optn.option_title}`}
                                                    />
                                                </FormLayout>
                                            )
                                        })
                                    }
                                    <DropZone
                                        allowMultiple={false}
                                        onDrop={handleDropZoneDrop}
                                    >
                                        {
                                            (!!variantData.variant_image_file || !!variantData.variant_image_path) &&
                                            <LegacyStack>
                                                <LegacyStack.Item>
                                                    <Thumbnail
                                                        source={
                                                            !!variantData.variant_image_file
                                                            ?
                                                            (
                                                                ['image/gif', 'image/jpeg', 'image/png'].includes(variantData.variant_image_file.type)
                                                                ?
                                                                window.URL.createObjectURL(variantData.variant_image_file)
                                                                :
                                                                ''
                                                            )
                                                            :
                                                            variantData.variant_image_path
                                                        }
                                                        size="large"
                                                    />
                                                </LegacyStack.Item>
                                                <LegacyStack.Item>
                                                    <Button>Change</Button>
                                                </LegacyStack.Item>
                                            </LegacyStack>
                                            // <div style={{padding: '0'}}>
                                            //     <LegacyStack vertical>
                                            //         <LegacyStack alignment="center">
                                            //         <Thumbnail
                                            //             size="small"
                                            //             alt={variantData.variant_image_file.name}
                                            //             source={
                                            //                 ['image/gif', 'image/jpeg', 'image/png'].includes(variantData.variant_image_file.type)
                                            //                 ? window.URL.createObjectURL(variantData.variant_image_file)
                                            //                 : 'NoteIcon'
                                            //             }
                                            //         />
                                            //         <div>
                                            //             {variantData.variant_image_file.name}{' '}
                                            //             <Text variant="bodySm" as="p">
                                            //             {variantData.variant_image_file.size} bytes
                                            //             </Text>
                                            //         </div>
                                            //         </LegacyStack>

                                            //     </LegacyStack>
                                            // </div>
                                        }
                                        {
                                            !variantData.variant_image_file && !variantData.variant_image_path &&
                                            <DropZone.FileUpload />
                                        }
                                    </DropZone>
                                </BlockStack>
                            </div>
                        </Box>
                    </LegacyCard>
                </Layout.Section>
            </Layout>
        </Page>
    )
}