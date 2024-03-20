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
import {
    json,
    redirect,
    unstable_composeUploadHandlers,
    unstable_createFileUploadHandler,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData
} from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit } from "@remix-run/react";
import { Products } from "../db.server";
import { useCallback, useEffect, useReducer, useState } from "react";

import CreatableSelect from "react-select/creatable";

import variantStyles from "~/styles/variant.css";
import { deleteFile, makeid } from "../utils";

import optionsJson from "../../json/options.json";

export const links = () => [
    { rel: "stylesheet", href: variantStyles },
];


export const loader = async ({ params, request }) => {
    await authenticate.admin(request)

    console.log('media loader params', params)

    const product = await Products.findById(params.product_id)

    const loaderResponse = {
        success: true,
        product
    }

    if ( !!params?.media_id && params.media_id != 'new' ) {
        loaderResponse.media = product.medias.find(vrnt => vrnt.media_id === params.media_id)
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
                const media_id = makeid(24)
                let product_options = formDataToCreate.get("product_options")
                product_options = JSON.parse(product_options)
                console.log('product_options', product_options)

                const media_title = formDataToCreate.get("media_title")
                const media_image_file = formDataToCreate.get('media_image_file')

                const foundProduct = await Products.findById(document_id)
                console.log('foundProduct', foundProduct)

                const existingVariants = !!foundProduct?.medias ? foundProduct.medias : []
                console.log('existingVariants', existingVariants)

                const newVariant = {
                    media_id,
                    media_title,
                    product_options
                }

                if (!!media_image_file && media_image_file != 'null') {
                    newVariant.variant_image_path = `/uploads/files/${media_image_file.name}`
                }

                const newVariants = [
                    ...existingVariants,
                    newVariant
                ]

                const isProductUpdated = await Products.findOneAndUpdate({
                    _id: document_id
                  }, {
                    medias: newVariants
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
                const variant_id_to_update = formDataToUpdate.get("media_id")
                const variant_title_to_update = formDataToUpdate.get("media_title")
                let product_options_to_update = formDataToUpdate.get("product_options")
                product_options_to_update = JSON.parse(product_options_to_update)
                const media_image_file_to_update = formDataToUpdate.get('media_image_file')

                const foundProductToUpdate = await Products.findById(document_id_to_update)
                // console.log('foundProductToUpdate', foundProductToUpdate)

                const existingVariantsToUpdate = !!foundProductToUpdate?.medias ? foundProductToUpdate.medias : []
                // console.log('existingVariantsToUpdate', existingVariantsToUpdate)
                
                const foundProductVariantIndex = existingVariantsToUpdate.findIndex(vrnt => vrnt.media_id == variant_id_to_update)
                // console.log('foundProductVariantIndex', foundProductVariantIndex)

                // console.log('existingVariantsToUpdate[foundProductVariantIndex].variant_image_path', existingVariantsToUpdate[foundProductVariantIndex].variant_image_path)
                const newVariantToUpdate = {
                    media_id: variant_id_to_update,
                    media_title: variant_title_to_update,
                    product_options: product_options_to_update,
                    variant_image_path: existingVariantsToUpdate[foundProductVariantIndex].variant_image_path,
                }

                if (!!media_image_file_to_update && media_image_file_to_update != 'null') {
                    console.log('media_image_file_to_update', typeof media_image_file_to_update, media_image_file_to_update)
                    newVariantToUpdate.variant_image_path = `/uploads/files/${media_image_file_to_update.name}`
                }

                const newMediasUpdated = [
                    ...existingVariantsToUpdate,
                ]
                newMediasUpdated[foundProductVariantIndex] = newVariantToUpdate

                console.log('newMediasUpdated', newMediasUpdated)

                const isProductUpdatedVariants = await Products.findOneAndUpdate({
                    _id: document_id_to_update
                  }, {
                    medias: newMediasUpdated
                })
                // console.log('isProductUpdatedVariants', isProductUpdatedVariants)
                return redirect(`/app/product/${foundProductToUpdate._id}`)
                break;

            case "DELETE":
                const formDataToDelete = await request.formData()

                const document_id_to_delete = formDataToDelete.get("document_id")
                const media_id_to_delete = formDataToDelete.get("media_id")

                const foundProductToDelete = await Products.findById(document_id_to_delete)

                const foundMediaToDelete = foundProductToDelete.medias.find(md => md.media_id === media_id_to_delete)
                deleteFile(foundMediaToDelete.variant_image_path)

                const new_Medias = foundProductToDelete.medias.filter(md => md.media_id != media_id_to_delete)

                const isMediaDeleted = await Products.findOneAndUpdate({
                    _id: document_id_to_delete
                  }, {
                    medias: new_Medias
                })

                return redirect(`/app/product/${foundProductToDelete._id}`)

                break;
        }

    } catch (error) {
        console.log('media action error', error)
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


const mediaDataReducer = (state, action) => {
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
        options: [],
        medias: []
    })

    const [mediaData, dispatchMediaData] = useReducer(mediaDataReducer, {
        media_id: '',
        product_options: [],
        media_image_file: null,
        variant_image_path: '',
    })

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => {
            dispatchMediaData({
                media_image_file: acceptedFiles[0]
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
            medias: !!loaderData?.product?.medias ? loaderData.product.medias : []
        })

        if (!!loaderData?.media) {
            dispatchMediaData({
                ...loaderData.media
            })
        }

    }, [loaderData])


    const handleVariantSelectOptionChange = (optn_index, selected_option) => {
        console.log('handleVariantSelectOptionChange optn_index, selected_option', optn_index, selected_option)

        const newVariantData = {
            ...mediaData
        }

        if (!!selected_option) {
            newVariantData.product_options[optn_index] = {
                option_id: selected_option.optn.option_id,
                option_value_id: selected_option.value,
                option_value_title: selected_option.label
            }
        } else {
            newVariantData.product_options[optn_index] = {}
        }

        console.log('newVariantData.product_options', newVariantData.product_options)

        dispatchMediaData(newVariantData)
    }


    const handleMediaSaveOrEditEvent = () => {
        console.log('handleMediaSaveOrEditEvent mediaData', mediaData)
        console.log('handleMediaSaveOrEditEvent productData', productData)
        const formData = new FormData()

        const media_title = mediaData.product_options.filter(vo => (!!vo && Object.keys(vo).length)).map(vo => vo.option_value_title).join(' / ')
        console.log('media_title', media_title)

        if (!!mediaData.media_id) {
            if (productData.medias.find(md => ((md.media_title === media_title) && (md.media_id !== mediaData.media_id)))) {
                shopify.toast.show("Variant Already Exists!")
            } else {
                formData.append('document_id', productData.id)
                formData.append('media_id', mediaData.media_id)
                formData.append('media_title', media_title)
                formData.append('product_options', JSON.stringify(mediaData.product_options))
                formData.append("media_image_file", mediaData.media_image_file)
                submit(formData, { replace: true, method: "PATCH", encType: "multipart/form-data" })
            }
        } else {
            if (productData.medias.find(md => md.media_title === media_title)) {
                shopify.toast.show("Variant Already Exists!")
            } else {
                formData.append('document_id', productData.id)
                formData.append('media_title', media_title)
                formData.append('product_options', JSON.stringify(mediaData.product_options))
                formData.append("media_image_file", mediaData.media_image_file)
                submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
            }
        }
    }


    const handleMediaDeleteEvent = () => {
        console.log('handleMediaDeleteEvent mediaData', mediaData)

        const formData = new FormData()
        formData.append('document_id', productData.id)
        formData.append("media_id", mediaData.media_id)
        submit(formData, { replace: true, method: "DELETE" })
    }

    console.log('productData', productData)
    console.log('mediaData', mediaData)

    return (
        <Page
            backAction={{
                content: '',
                url: `/app/product/${params.product_id}`
            }}
            title={!!mediaData.media_id ? mediaData.media_title : "Add Media"}
            primaryAction={{
                content: !!mediaData.media_id ? 'Edit Media' : 'Save Media',
                onAction: handleMediaSaveOrEditEvent
            }}
            secondaryActions={[{
                content: 'Delete Media',
                destructive: true,
                onAction: handleMediaDeleteEvent,
            }]}
        >
            <Layout>
                <Layout.Section variant="oneThird">
                    <LegacyCard title="Medias">
                        <div className="ezVmi">
                            <ul id="mediasList" className="V3AvU">
                            </ul>
                        </div>
                    </LegacyCard>
                </Layout.Section>

                <Layout.Section>
                    <LegacyCard title="Options">
                        <Box padding="400">
                            <div className="blockStack-parent">
                                <BlockStack gap="400">
                                    {
                                        productData.options
                                        .filter(optn => optionsJson.find(oJOption => oJOption.slug === optn.option_slug).changeMedia)
                                        .map((optn, optn_index) => {
                                            return (
                                                !!optn?.option_values?.length &&
                                                <FormLayout key={optn.option_id}>
                                                    <label for={optn.option_id}>{optn.option_title}</label>
                                                    <CreatableSelect
                                                        id={optn.option_id}
                                                        key={optn.option_id}
                                                        // defaultValue={optn.option_values[0].option_value_id}
                                                        value={{
                                                            value: mediaData?.product_options[optn_index]?.option_value_id,
                                                            label: mediaData?.product_options[optn_index]?.option_value_title,
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
                                            (!!mediaData.media_image_file || !!mediaData.variant_image_path) &&
                                            <LegacyStack>
                                                <LegacyStack.Item>
                                                    <Thumbnail
                                                        source={
                                                            !!mediaData.media_image_file
                                                            ?
                                                            (
                                                                ['image/gif', 'image/jpeg', 'image/png'].includes(mediaData.media_image_file.type)
                                                                ?
                                                                window.URL.createObjectURL(mediaData.media_image_file)
                                                                :
                                                                ''
                                                            )
                                                            :
                                                            mediaData.variant_image_path
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
                                            //             alt={mediaData.media_image_file.name}
                                            //             source={
                                            //                 ['image/gif', 'image/jpeg', 'image/png'].includes(mediaData.media_image_file.type)
                                            //                 ? window.URL.createObjectURL(mediaData.media_image_file)
                                            //                 : 'NoteIcon'
                                            //             }
                                            //         />
                                            //         <div>
                                            //             {mediaData.media_image_file.name}{' '}
                                            //             <Text variant="bodySm" as="p">
                                            //             {mediaData.media_image_file.size} bytes
                                            //             </Text>
                                            //         </div>
                                            //         </LegacyStack>

                                            //     </LegacyStack>
                                            // </div>
                                        }
                                        {
                                            !mediaData.media_image_file && !mediaData.variant_image_path &&
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