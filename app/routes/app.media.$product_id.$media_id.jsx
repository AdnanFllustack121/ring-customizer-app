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
    Link,
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

import mediaStyles from "~/styles/media.css";
import { deleteFile, makeid } from "../utils";

import optionsJson from "../../json/options.json";

export const links = () => [
    { rel: "stylesheet", href: mediaStyles },
]


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


export const action = async ({ params, request }) => {
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

                const existingMedias = !!foundProduct?.medias ? foundProduct.medias : []
                console.log('existingMedias', existingMedias)

                const newMedia = {
                    media_id,
                    media_title,
                    product_options
                }

                if (!!media_image_file && media_image_file != 'null') {
                    newMedia.media_image_path = `/uploads/files/${media_image_file.name}`
                }

                const newMedias = [
                    ...existingMedias,
                    newMedia
                ]

                const isProductUpdated = await Products.findOneAndUpdate({
                    _id: document_id
                  }, {
                    medias: newMedias
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
                const media_id_to_update = formDataToUpdate.get("media_id")
                const media_title_to_update = formDataToUpdate.get("media_title")
                let product_options_to_update = formDataToUpdate.get("product_options")
                product_options_to_update = JSON.parse(product_options_to_update)
                const media_image_file_to_update = formDataToUpdate.get('media_image_file')

                const foundProductToUpdate = await Products.findById(document_id_to_update)
                // console.log('foundProductToUpdate', foundProductToUpdate)

                const existingMediasToUpdate = !!foundProductToUpdate?.medias ? foundProductToUpdate.medias : []
                // console.log('existingMediasToUpdate', existingMediasToUpdate)
                
                const foundProductMediaIndex = existingMediasToUpdate.findIndex(vrnt => vrnt.media_id == media_id_to_update)
                // console.log('foundProductMediaIndex', foundProductMediaIndex)

                // console.log('existingMediasToUpdate[foundProductMediaIndex].media_image_path', existingMediasToUpdate[foundProductMediaIndex].media_image_path)
                const newMediaToUpdate = {
                    media_id: media_id_to_update,
                    media_title: media_title_to_update,
                    product_options: product_options_to_update,
                    media_image_path: existingMediasToUpdate[foundProductMediaIndex].media_image_path,
                }

                if (!!media_image_file_to_update && media_image_file_to_update != 'null') {
                    console.log('media_image_file_to_update', typeof media_image_file_to_update, media_image_file_to_update)
                    newMediaToUpdate.media_image_path = `/uploads/files/${media_image_file_to_update.name}`
                }

                const newMediasUpdated = [
                    ...existingMediasToUpdate,
                ]
                newMediasUpdated[foundProductMediaIndex] = newMediaToUpdate

                console.log('newMediasUpdated', newMediasUpdated)

                const isProductUpdatedMedias = await Products.findOneAndUpdate({
                    _id: document_id_to_update
                  }, {
                    medias: newMediasUpdated
                })
                // console.log('isProductUpdatedMedias', isProductUpdatedMedias)
                return redirect(`/app/product/${foundProductToUpdate._id}`)
                break;

            case "DELETE":
                const formDataToDelete = await request.formData()

                const document_id_to_delete = formDataToDelete.get("document_id")
                console.log('document_id_to_delete', document_id_to_delete)

                const media_id_to_delete = formDataToDelete.get("media_id")
                console.log('media_id_to_delete', media_id_to_delete)

                const foundProductToDelete = await Products.findById(document_id_to_delete)

                if (params.media_id === 'all') {
                    const media_ids_to_delete = JSON.parse(media_id_to_delete)
                    console.log('media_ids_to_delete', media_ids_to_delete)
                    const foundMediasToDelete = foundProductToDelete.medias.filter(md => media_ids_to_delete.includes(md.media_id))
                    console.log('foundMediasToDelete', foundMediasToDelete)

                    foundMediasToDelete.forEach(foundMediaToDelete => {
                        if (!!foundMediaToDelete?.media_image_path) {
                            deleteFile(foundMediaToDelete?.media_image_path)
                        }
                    })

                    const new_Medias = foundProductToDelete.medias.filter(md => !media_ids_to_delete.includes(md.media_id))
                    const isMediaDeleted = await Products.findOneAndUpdate({
                        _id: document_id_to_delete
                      }, {
                        medias: new_Medias
                    })
                } else {
                    const foundMediaToDelete = foundProductToDelete.medias.find(md => md.media_id === media_id_to_delete)
                    deleteFile(foundMediaToDelete.media_image_path)
                    const new_Medias = foundProductToDelete.medias.filter(md => md.media_id != media_id_to_delete)
                    const isMediaDeleted = await Products.findOneAndUpdate({
                        _id: document_id_to_delete
                      }, {
                        medias: new_Medias
                    })
                }


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


export default function Media() {

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
        media_image_path: '',
        files: []
    })
    console.log('mediaData.files', mediaData.files)

    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => {
            dispatchMediaData({
                media_image_file: acceptedFiles[0]
            })
        },
        [],
    );

    const handleMediaDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => {
            console.log('handleMediaDropZoneDrop mediaData.files, acceptedFiles', mediaData.files, acceptedFiles)
            // setFiles((files) => [...files, ...acceptedFiles]),
            dispatchMediaData({
                files: [...mediaData.files, ...acceptedFiles]
            })
        },
        [mediaData],
    )

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


    const handleMediaSelectOptionChange = (optn_index, selected_option) => {
        console.log('handleMediaSelectOptionChange optn_index, selected_option', optn_index, selected_option)

        const newMediaData = {
            ...mediaData
        }

        if (!!selected_option) {
            newMediaData.product_options[optn_index] = {
                option_id: selected_option.optn.option_id,
                option_value_id: selected_option.value,
                option_value_title: selected_option.label
            }
        } else {
            newMediaData.product_options[optn_index] = {}
        }

        console.log('newMediaData.product_options', newMediaData.product_options)

        dispatchMediaData(newMediaData)
    }


    const handleMediaSaveOrEditEvent = () => {
        console.log('handleMediaSaveOrEditEvent mediaData', mediaData)
        console.log('handleMediaSaveOrEditEvent productData', productData)
        const formData = new FormData()

        const media_title = mediaData.product_options.filter(vo => (!!vo && Object.keys(vo).length)).map(vo => vo.option_value_title).join(' / ')
        console.log('media_title', media_title)

        if (!!mediaData.media_id) {
            if (productData.medias.find(md => ((md.media_title === media_title) && (md.media_id !== mediaData.media_id)))) {
                shopify.toast.show("Media Already Exists!")
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
                shopify.toast.show("Media Already Exists!")
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
                                                            handleMediaSelectOptionChange(optn_index, selected_option)
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
                                            (!!mediaData.media_image_file || !!mediaData.media_image_path) &&
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
                                                            mediaData.media_image_path
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
                                            !mediaData.media_image_file && !mediaData.media_image_path &&
                                            <DropZone.FileUpload />
                                        }
                                    </DropZone>

                                    <DropZone
                                        onDrop={handleMediaDropZoneDrop}
                                        outline={false}
                                    >
                                        <div className="_Container_1w9ad_1">
                                            <div className="_Grid_1o4jr_4 _BackgroundGrid_1o402_1">
                                                {mediaData.files.map((file, index) => {
                                                    return <div key={index} className="_BackgroundGridItem_1o402_7"></div>
                                                })}
                                            </div>

                                            <div className="_Grid_1o4jr_4">
                                                {mediaData.files.map((file, index) => {
                                                    return (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                transformOrigin: '0px 0px 0px',
                                                                transition: 'transform linear'
                                                            }}
                                                        >

                                                            <div className="_Container_sfmwl_1" role="button">
                                                                <div className="_Overlay_qqzzj_1 _Draggable_qqzzj_24">
                                                                    <div className="_OverlayButton_qqzzj_92">
                                                                        <button
                                                                            className="Polaris-Button Polaris-Button--pressable Polaris-Button--variantSecondary Polaris-Button--sizeMedium Polaris-Button--textAlignCenter"
                                                                            aria-label="Edit"
                                                                            type="button"
                                                                        >
                                                                            <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--medium">Edit</span>
                                                                        </button>
                                                                    </div>
                                                                    <span className="_DragHandle_qqzzj_67" role="button" tabindex="0" aria-disabled="false" aria-roledescription="sortable" aria-describedby="DndDescribedBy-3">
                                                                        <span className="Polaris-Icon">
                                                                            <svg viewBox="0 0 20 20" className="Polaris-Icon__Svg" focusable="false" aria-hidden="true">
                                                                                <path d="M7.5 4.5c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"></path>
                                                                                <path d="M7.5 8.75c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"></path>
                                                                                <path d="M6.5 14c0-.552.448-1 1-1h.5c.552 0 1 .448 1 1v.5c0 .552-.448 1-1 1h-.5c-.552 0-1-.448-1-1v-.5Z"></path>
                                                                                <path d="M12 4.5c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"></path>
                                                                                <path d="M11 9.75c0-.552.448-1 1-1h.5c.552 0 1 .448 1 1v.5c0 .552-.448 1-1 1h-.5c-.552 0-1-.448-1-1v-.5Z"></path>
                                                                                <path d="M12 13c-.552 0-1 .448-1 1v.5c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552-.448-1-1-1h-.5Z"></path>
                                                                            </svg>
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <div className="_ThumbnailWrapper_sfmwl_67">
                                                                    <img
                                                                        className="_ThumbnailElement_sfmwl_58"
                                                                        src={
                                                                            ['image/gif', 'image/jpeg', 'image/png'].includes(file.type)
                                                                            ? window.URL.createObjectURL(file)
                                                                            : NoteIcon
                                                                        }
                                                                        alt={file.name}
                                                                    />
                                                                </div>
                                                                <div className="_Checkbox_sfmwl_25">
                                                                    <label className="Polaris-Choice Polaris-Choice--labelHidden Polaris-Checkbox__ChoiceLabel" for=":r8l:">
                                                                        <span className="Polaris-Choice__Control">
                                                                            <span className="Polaris-Checkbox">
                                                                                <input
                                                                                    id=":r8l:"
                                                                                    type="checkbox"
                                                                                    className="Polaris-Checkbox__Input"
                                                                                    aria-invalid="false"
                                                                                    role="checkbox"
                                                                                    aria-checked="false"
                                                                                    value=""
                                                                                />
                                                                                <span className="Polaris-Checkbox__Backdrop"></span>
                                                                                <span className="Polaris-Checkbox__Icon Polaris-Checkbox--animated">
                                                                                    <svg viewBox="0 0 16 16" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
                                                                                        <path
                                                                                            className=""
                                                                                            d="M1.5,5.5L3.44655,8.22517C3.72862,8.62007,4.30578,8.64717,4.62362,8.28044L10.5,1.5"
                                                                                            transform="translate(2 2.980376)"
                                                                                            opacity="0"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            stroke-width="2"
                                                                                            stroke-linecap="round"
                                                                                            stroke-linejoin="round"
                                                                                            pathLength="1"
                                                                                        >
                                                                                        </path>
                                                                                    </svg>
                                                                                </span>
                                                                            </span>
                                                                        </span>
                                                                        <span className="Polaris-Choice__Label">
                                                                            <span>Select</span>
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    )
                                                })}

                                                {/* <div className="_ThumbnailLoading_12xcv_1">
                                                    <div className="_ThumbnailOverlay_12xcv_15"></div>
                                                    <div className="_LoadingThumbnailSpinner_12xcv_36">
                                                        <span className="Polaris-Spinner Polaris-Spinner--sizeSmall">
                                                            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M7.229 1.173a9.25 9.25 0 1011.655 11.412 1.25 1.25 0 10-2.4-.698 6.75 6.75 0 11-8.506-8.329 1.25 1.25 0 10-.75-2.385z"></path>
                                                            </svg>
                                                        </span>
                                                        <span role="status">
                                                            <span className="Polaris-Text--root Polaris-Text--visuallyHidden"></span>
                                                        </span>
                                                        <div className="Polaris-Box" style={{
                                                            '--pc-box-padding-block-start-xs': 'var(--p-space-200)'
                                                        }}>
                                                            <p className="Polaris-Text--root Polaris-Text--bodySm">Uploading to Files…</p>
                                                        </div>
                                                    </div>
                                                </div> */}

                                                {/* <div style={{
                                                    transformOrigin: '0px 0px 0px',
                                                    transition: 'transform linear'
                                                }}>
                                                    <div class="_Container_sfmwl_1 _Loading_sfmwl_109" role="button">
                                                        <div class="_Overlay_qqzzj_1 _Loading_qqzzj_43 _Draggable_qqzzj_24">
                                                            <span class="Polaris-Spinner Polaris-Spinner--sizeLarge">
                                                                <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M15.542 1.487A21.507 21.507 0 00.5 22c0 11.874 9.626 21.5 21.5 21.5 9.847 0 18.364-6.675 20.809-16.072a1.5 1.5 0 00-2.904-.756C37.803 34.755 30.473 40.5 22 40.5 11.783 40.5 3.5 32.217 3.5 22c0-8.137 5.3-15.247 12.942-17.65a1.5 1.5 0 10-.9-2.863z">
                                                                    </path>
                                                                </svg>
                                                            </span>
                                                            <span role="status">
                                                                <span class="Polaris-Text--root Polaris-Text--visuallyHidden"></span>
                                                            </span>
                                                            <span class="_LoadingLabel_qqzzj_63">Processing…</span>
                                                        </div>
                                                        <div class="_ThumbnailWrapper_sfmwl_67">
                                                            <img class="_ThumbnailElement_sfmwl_58" src="blob:https://admin.shopify.com/9b2fee2b-a47f-4d14-b659-0c9a174316a3" alt="" />
                                                        </div>
                                                        <div class="_Checkbox_sfmwl_25">
                                                            <label class="Polaris-Choice Polaris-Choice--labelHidden Polaris-Checkbox__ChoiceLabel" for=":rhl:">
                                                                <span class="Polaris-Choice__Control">
                                                                    <span class="Polaris-Checkbox">
                                                                        <input id=":rhl:" type="checkbox" class="Polaris-Checkbox__Input" aria-invalid="false" role="checkbox" aria-checked="false" value="" />
                                                                        <span class="Polaris-Checkbox__Backdrop"></span>
                                                                        <span class="Polaris-Checkbox__Icon Polaris-Checkbox--animated">
                                                                            <svg viewBox="0 0 16 16" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
                                                                                <path
                                                                                    class=""
                                                                                    d="M1.5,5.5L3.44655,8.22517C3.72862,8.62007,4.30578,8.64717,4.62362,8.28044L10.5,1.5"
                                                                                    transform="translate(2 2.980376)"
                                                                                    opacity="0"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    stroke-width="2"
                                                                                    stroke-linecap="round"
                                                                                    stroke-linejoin="round"
                                                                                    pathLength="1"
                                                                                >
                                                                                </path>
                                                                            </svg>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                                <span class="Polaris-Choice__Label"><span>Select</span></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div> */}

                                                <div className="_DropZonePlaceholder_atpeq_4 _thumbnail_atpeq_25">
                                                    <div className="_Content_atpeq_47">

                                                        <button
                                                            className="Polaris-Button Polaris-Button--pressable Polaris-Button--variantSecondary Polaris-Button--sizeMedium Polaris-Button--textAlignCenter"
                                                            type="button"
                                                        >
                                                            <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--medium">Add</span>
                                                        </button>

                                                        <div className="_Link_atpeq_37">
                                                            <Link monochrome removeUnderline>Add from URL</Link>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* {
                                                mediaData.files.length > 0 && (
                                                    <div style={{ padding: '0' }}>
                                                        <LegacyStack vertical>
                                                            {mediaData.files.map((file, index) => (
                                                                <LegacyStack alignment="center" key={index}>
                                                                    <Thumbnail
                                                                    size="small"
                                                                    alt={file.name}
                                                                    source={
                                                                        ['image/gif', 'image/jpeg', 'image/png'].includes(file.type)
                                                                        ? window.URL.createObjectURL(file)
                                                                        : NoteIcon
                                                                    }
                                                                    />
                                                                    <div>
                                                                    {file.name}{' '}
                                                                    <Text variant="bodySm" as="p">
                                                                        {file.size} bytes
                                                                    </Text>
                                                                    </div>
                                                                </LegacyStack>
                                                            ))}
                                                        </LegacyStack>
                                                    </div>
                                                )
                                            }
                                            <DropZone.FileUpload /> */}

                                        </div>
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