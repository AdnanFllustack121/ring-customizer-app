import { BlockStack, Box, Button, DropZone, FormLayout, InlineStack, Layout, LegacyCard, LegacyStack, Page, Text, TextField, Thumbnail } from "@shopify/polaris";
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

    const product = await Products.findById(params.product_id)

    return json({
        success: true,
        product
    })
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

    const [file, setFile] = useState(null)

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) =>
        setFile((file) => acceptedFiles[0]),
        [],
    );

    const [productData, dispatchProductData] = useReducer(productDataReducer, {
        id: '',
        product_id: '',
        product_title: '',
        product_image: '',
        product_price: '',
        options: [],
        variants: []
    })
    console.log('productData', productData)


    const [variantData, dispatchVariantData] = useReducer(variantDataReducer, {
        variant_id: '',
        variant_options: [],
    })


    useEffect(() => {
        console.log('loaderData', loaderData)

        dispatchProductData({
            id: loaderData.product._id,
            product_id: loaderData.product.product_id,
            product_title: loaderData.product.product_title,
            options: !!loaderData?.product?.options ? loaderData.product.options : [],
        })

    }, [loaderData])


    const handleVariantSelectOptionChange = (optn_index, selected_option) => {
        console.log('handleVariantSelectOptionChange optn_index, selected_option', optn_index, selected_option)

        const newVariantData = {
            ...variantData
            // variant_options: [...variantData.variant_options]
        }

        newVariantData.variant_options[optn_index] = {
            option_id: selected_option.optn.option_id,
            option_value_id: selected_option.value,
            option_value_title: selected_option.label
        }

        dispatchVariantData(newVariantData)
    }

    console.log('variantData', variantData)

    const handleVariantSaveEvent = () => {
        console.log('handleVariantSaveEvent variantData', variantData)
        console.log('productData', productData)

        const formData = new FormData()
        formData.append('document_id', productData.id)
        formData.append('variant_options', JSON.stringify(variantData.variant_options))
        
        formData.append("variant_image_file", file)

        submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
    }

    return (
        <Page
            backAction={{
                content: '',
                url: `/app/product/${params.product_id}`
            }}
            title="Add variant"
            primaryAction={{
                content: 'Save Variant',
                onAction: handleVariantSaveEvent
            }}
        >
            <Layout>
                <Layout.Section variant="oneThird">
                    <LegacyCard title="Variants">
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
                                                <FormLayout
                                                    key={optn.option_id}
                                                >
                                                    {/* <TextField label={optn.option_title} /> */}
                                                    <CreatableSelect
                                                        key={optn.option_id}
                                                        // defaultValue={optn.option_values[0].option_value_id}
                                                        // value={variantData.variant_options[optn_index]?.option_value_id}
                                                        onChange={(selected_option) => {
                                                            console.log('selected_option', selected_option)
                                                            console.log('variantData.variant_options[optn_index]?.option_value_id', variantData.variant_options[optn_index]?.option_value_id)
                                                            handleVariantSelectOptionChange(optn_index, selected_option)
                                                        }}
                                                        isLoading={false}
                                                        isClearable
                                                        isSearchable
                                                        options={optn.option_values.map(ov => {
                                                            return {
                                                                value: ov.option_value_id,
                                                                label: ov.option_value_title,
                                                                optn
                                                            }
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
                                        {console.log('file', file)}
                                        {
                                            !!file &&
                                            <LegacyStack>
                                                <LegacyStack.Item>
                                                    <Thumbnail
                                                        source={
                                                            ['image/gif', 'image/jpeg', 'image/png'].includes(file.type)
                                                            ? window.URL.createObjectURL(file) : ''
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
                                            //             alt={file.name}
                                            //             source={
                                            //                 ['image/gif', 'image/jpeg', 'image/png'].includes(file.type)
                                            //                 ? window.URL.createObjectURL(file)
                                            //                 : 'NoteIcon'
                                            //             }
                                            //         />
                                            //         <div>
                                            //             {file.name}{' '}
                                            //             <Text variant="bodySm" as="p">
                                            //             {file.size} bytes
                                            //             </Text>
                                            //         </div>
                                            //         </LegacyStack>

                                            //     </LegacyStack>
                                            // </div>
                                        }
                                        {
                                            !file &&
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