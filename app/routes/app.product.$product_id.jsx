import { forwardRef, useCallback, useEffect, useReducer, useState } from "react";
import { json, unstable_composeUploadHandlers, unstable_createFileUploadHandler, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  IndexTable,
  useIndexResourceState,
  Thumbnail,
  LegacyCard,
  Tooltip,
  Modal,
  LegacyStack,
  DropZone,
  Select,
  Checkbox,
  Icon,
  Popover,
  ActionList,
  ButtonGroup,
  TextField,
  Divider,
  FormLayout,
} from "@shopify/polaris";
import {
  AddImageMajor,
  CircleCancelMajor,
  CircleDotsMajor,
  DeleteMajor,
  PlusMinor
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { Files, Products, Session } from "../db.server";
import { deleteFile, generateVariations, makeid } from "../utils";

import productStyles from "~/styles/product.css";

import CircleTick from "../assets/CircleTick.svg";

export const links = () => [
  { rel: "stylesheet", href: productStyles },
];

export const loader = async ({ params, request }) => {
  await authenticate.admin(request)

  const product = await Products.findById(params.product_id)

  return json({
    success: true,
    product: product,
  })
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request)

  switch (request.method) {
    case "POST":

      if (request.headers.get('content-type').includes('multipart/form-data')) {
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

        const createType = formDataToCreate.get("create")

        if (createType === 'option') {
          const document_id = formDataToCreate.get("document_id")
          const option_id = formDataToCreate.get("option_id")
          const file_id = formDataToCreate.get("file_id")
  
          const option_value_title = formDataToCreate.get("option_value_title")
          const option_image_path = formDataToCreate.get("option_image_path")
          const option_value_price = formDataToCreate.get("option_value_price")
          const preview_image_file = formDataToCreate.get("preview_image_file")
  
          const foundProduct = await Products.findById(document_id)

          const obj = {
            file_id,
            option_value_id: makeid(24),
            option_value_title,
            option_value_slug: option_value_title.toLowerCase().replace(/ /g,"_"),
            option_image_path,
            // option_image_path: !!preview_image_file ? `/uploads/files/${preview_image_file.name}` : '',
            option_value_price,
            // preview_image_path: !!preview_image_file ? `/uploads/images/${preview_image_file.name}` : '',
          }

          if (!!preview_image_file) {
            obj.option_image_path = !!preview_image_file ? `/uploads/files/${preview_image_file.name}` : ''
            const isColorCreated = await Files.create({
              name: option_value_title,
              // type: type,
              filePath: `/uploads/files/${preview_image_file.name}`
            })
            console.log('isColorCreated', isColorCreated)
            obj.file_id = isColorCreated._id.toString()
          }

          const categoriesNew = foundProduct.options.map(cat => {
            if (cat.option_id === option_id) {

              if (!!cat?.option_values?.length) {
                return {
                  ...cat,
                  option_values: [
                    ...cat.option_values,
                    obj
                  ]
                }
              } else {
                return {
                  ...cat,
                  option_values: [obj]
                }
              }
            } else {
              return cat
            }
          })

          console.log('categoriesNew', categoriesNew)

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            options: categoriesNew
          })

        }

      } else {
        const formData = await request.formData()
        const createType = formData.get("create")
  
        const product_id = formData.get("document_id")
  
        const product_title = formData.get("product_title")
  
        const foundProduct = await Products.findById(product_id)
  
        const categoryTitle = formData.get("option_title")
        const optionType = formData.get("option_type")
  
        if (!!foundProduct) {
          if (createType === "category") {
  
            const newCategory = {
              option_id: makeid(24),
              option_title: categoryTitle,
              option_type: optionType,
              option_slug: categoryTitle.toLowerCase().replace(/ /g,"_")
            }
  
            if (!!foundProduct?.options) {
              const isProductUpdated = await Products.findOneAndUpdate({
                _id: product_id
              }, {
                options: [...foundProduct.options, newCategory]
              })
  
              return json({
                success: true,
                product: isProductUpdated,
                message: "Success!"
              })
            } else {
              const isProductUpdated = await Products.findOneAndUpdate({
                _id: product_id
              }, {
                options: [newCategory]
              })
              return json({
                success: true,
                product: isProductUpdated,
                message: "New Option Added!"
              })
            }
          }
        }
  
        // const doExists = await Products.findOne({ product_id })
        // if (doExists) {
        //   return json({
        //     success: false,
        //     message: "Already Exists"
        //   })
        // } else {
        //   const isProductCreated = await Products.create({
        //     product_id,
        //     product_title
        //   })
    
        //   return json({
        //     success: true,
        //     product: isProductCreated,
        //     message: "Success!"
        //   })
        // }
      }

      break;

    case "PATCH":
      if (request.headers.get('content-type').includes('multipart/form-data')) {
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

        const document_id = formDataToUpdate.get("document_id")
        const found_product = await Products.findById(document_id)

        const updateType = formDataToUpdate.get("update")
        console.log('updateType', updateType)

        if (updateType === 'option') {

          const option_id = formDataToUpdate.get("option_id")

          console.log('option_id', option_id)

          const file_id = formDataToUpdate.get("file_id")

          const option_value_id = formDataToUpdate.get("option_value_id")
          const option_value_title = formDataToUpdate.get("option_value_title")
          const option_image_path = formDataToUpdate.get("option_image_path")
          const option_value_price = formDataToUpdate.get("option_value_price")
          const preview_image_file = formDataToUpdate.get("preview_image_file")

          console.log('preview_image_file', preview_image_file, !!preview_image_file)

          const optionObjToUpdate = {
            file_id,
            option_value_id,
            option_value_title,
            option_value_slug: option_value_title.toLowerCase().replace(/ /g,"_"),
            option_image_path,
            option_value_price
          }

          if (!!preview_image_file) {
            // optionObjToUpdate.preview_image_path = !!preview_image_file ? `/uploads/images/${preview_image_file.name}` : ''

            optionObjToUpdate.option_image_path = !!preview_image_file ? `/uploads/files/${preview_image_file.name}` : ''
            const isColorCreated = await Files.create({
              name: option_value_title,
              // type: type,
              filePath: `/uploads/files/${preview_image_file.name}`
            })
          }

          console.log('optionObjToUpdate', optionObjToUpdate)

          const categoryOptionToUpdate = found_product.options.map(cat => {
            if (cat.option_id === option_id) {

              const optionsModified = cat.option_values.map(opt => {
                if (opt.option_value_id === option_value_id) {

                  console.log('!!opt.preview_image_path && !!preview_image_file', !!opt.preview_image_path && !!preview_image_file)

                  if (!!opt.preview_image_path && !!preview_image_file) {
                    deleteFile(opt.preview_image_path)
                  }

                  return {
                    ...opt,
                    ...optionObjToUpdate
                  }
                } else {
                  return opt
                }
              })

              return {
                ...cat,
                option_values: optionsModified
              }
            } else {
              return cat
            }
          })

          console.log('categoryOptionToUpdate', JSON.stringify(categoryOptionToUpdate))

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            options: categoryOptionToUpdate
          })

        }

      } else {

        const formData = await request.formData()
        const document_id = formData.get("document_id")

        const found_product = await Products.findById(document_id)
        const updateType = formData.get("update")
        console.log('updateType', updateType)

        if (!!updateType && updateType === 'category') {
          // Update Category

          const option_id = formData.get('option_id')
          const option_title = formData.get('option_title')
          const option_type = formData.get("option_type")

          const updatedCategories = found_product.options.map(cat => {
            if (option_id == cat.option_id) {
              return {
                ...cat,
                option_title,
                option_type,
                option_slug: option_title.toLowerCase().replace(/ /g,"_")
              }
            } else {
              return cat
            }
          })

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            options: updatedCategories
          })

        } else if (!!updateType && updateType === 'option') {
          // Update Option


          
        } else if (!!updateType && updateType === 'variants') {
          const variants = formData.get("variants")
          // console.log('variants', variants)

          const updateVariants = JSON.parse(variants).map(variant => {
            if (!!variant?.variant_id) {
              return variant
            } else {
              return {
                ...variant,
                variant_id: makeid(24)
              }
            }
          })

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            variants: JSON.parse(variants)
          })

        } else {
          const product_id = formData.get("product_id")
          const product_title = formData.get("product_title")
          const product_image = formData.get("product_image")
          const product_price = formData.get("product_price")

          console.log('product_price', product_price)

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            product_id,
            product_title,
            product_image,
            product_price
          })

        }

      }

      break;

    case "DELETE":
      const formDataToDelete = await request.formData()

      const document_id = formDataToDelete.get("document_id")
      const deleteType = formDataToDelete.get("delete")

      const productToDeleteOptionColor = await Products.findById(document_id)

      if (deleteType === "category") {
        // Delete Category
        const option_id = formDataToDelete.get("option_id")

        const categoryIndex = productToDeleteOptionColor.options.findIndex(cat => cat.option_id === option_id)

        if (
          (!!categoryIndex || (categoryIndex === 0)) &&
          (
            (!!productToDeleteOptionColor.options[categoryIndex]?.option_values && !productToDeleteOptionColor.options[categoryIndex].option_values.length) ||
            (!productToDeleteOptionColor.options[categoryIndex]?.option_values)
          )
        ) {
          productToDeleteOptionColor.options.splice(categoryIndex, 1)
          const isProductOptionUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            options: productToDeleteOptionColor.options
          })
        }

      } else if (deleteType === "option") {
        // Delete Option
        const option_id = formDataToDelete.get("option_id")
        const option_value_id = formDataToDelete.get("option_value_id")

        const categoryIndex = productToDeleteOptionColor.options.findIndex(cat => cat.option_id === option_id)
        console.log('categoryIndex', categoryIndex)

        const optionIndex = productToDeleteOptionColor.options[categoryIndex].option_values.findIndex(opt => opt.option_value_id === option_value_id)
        console.log('optionIndex', optionIndex)

        // Delete the file first
        if (!!productToDeleteOptionColor.options[categoryIndex].option_values[optionIndex].preview_image_path) {
          await deleteFile(productToDeleteOptionColor.options[categoryIndex].option_values[optionIndex].preview_image_path)
        }

        productToDeleteOptionColor.options[categoryIndex].option_values.splice(optionIndex, 1)

        const isProductOptionUpdated = await Products.findOneAndUpdate({
          _id: document_id
        }, {
          options: productToDeleteOptionColor.options
        })

      } else {
        const optionType = formDataToDelete.get("optionType")
        const option_value_title = formDataToDelete.get("option_value_title")
  
        const optionArr = productToDeleteOptionColor.option_values[optionType]
        const optionIndex = optionArr.findIndex(o => o.option_value_title === option_value_title)
  
        // Delete the file first
        if (!!optionArr[optionIndex].preview_image_path) {
          await deleteFile(optionArr[optionIndex].preview_image_path)
        }
  
        optionArr.splice(optionIndex, 1)
  
        const newOptions = {
          ...productToDeleteOptionColor.option_values,
          [optionType]: optionArr
        }
  
        const isProductOptionUpdated = await Products.findOneAndUpdate({
          _id: document_id
        }, {
          option_values: newOptions
        })
      }


      break;
  
    default:
      break;
  }

  return json({
    success: true
  })
};

const categoryModalReducer = (state, action) => {
  switch (action.type) {
      case "CLEAR":
          return {
              isActive: false,
              option_id: '',
              option_title: ''
          }
      default:
        const newOne = { ...state, ...action }
        return newOne
  }
}

const optionModalReducer = (state, action) => {

  console.log('action.isActive', action.isActive)

  switch (action.isActive) {
      case false:
        return {
          isActive: false,
          option_id: '',
          file_id: '',
          option_value_id: '',
          option_value_title: '',
          option_image_path: '',
          option_value_price: '',
          preview_image_file: '',
          preview_image_path: ''
        }
      default:
        const newOne = { ...state, ...action }
        return newOne
  }
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

export default function Product() {

  const navigate = useNavigate()
  const loaderData = useLoaderData()
  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();

  const isLoading = ["loading", "submitting"].includes(navigation.state)

  const [files, setFiles] = useState([])

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

  const [enabledOptions, setEnabledOptions] = useState({
    finish: false,
    engraved_designs: false,
    drag_knob: false,
    drag_plate: false,
    handle: false,
  })

  const [previewMainImages, setMainImage] = useState({})


  const [categoryModalData, dispatchCategoryModalData] = useReducer(categoryModalReducer, {
    isActive: false,
    option_id: '',
    option_title: '',
    option_type: ''
  })

  const optionModalToggleActive = useCallback(({...args}) => {

    if (args?.isActive === false) {
      args = {
        ...args,
        option_id: '',
        option_title: '',
        option_type: ''
      }
    }

    dispatchCategoryModalData(args)
  }, [])


  const [optionModalData, dispatchOptionModalData] = useReducer(optionModalReducer, {
    isActive: false,
    option_id: '',
    file_id: '',
    option_value_id: '',
    option_value_title: '',
    option_image_path: '',
    option_value_price: '',
    preview_image_file: '',
    preview_image_path: ''
  })

  const handleSelectChange = useCallback(
    (value) => dispatchOptionModalData({ file_id: value.id, option_value_title: value.label, option_image_path: value.source }),
    [],
  )


  const toggleOptionModalActive = useCallback((args = {}) => {

    console.log('args', args)

    const { isActive, option_id, option_value_id } = args

    if (!!option_id) {

      let the_obj = {
        isActive: true,
        option_id: option_id
      }

      console.log('files', files)

      if (!!option_value_id) {
        console.log('option_value_id', option_value_id)
        console.log('productData', productData)
        console.log('productData.options', productData.options)
        const categoryObj = productData.options.find(cat => cat.option_id === option_id)
        console.log('categoryObj', categoryObj)

        const optionObj = categoryObj.option_values.find(opt => opt.option_value_id === option_value_id)

        the_obj = {
          ...the_obj,
          file_id: optionObj.file_id,
          option_value_id: option_value_id,
          option_value_title: optionObj.option_value_title,
          option_image_path: optionObj.option_image_path,
          option_value_price: optionObj.option_value_price,
          preview_image_path: optionObj.preview_image_path
        }
      } else {
        if (!!files && !!files.length) {
          // the_obj = {
          //   ...the_obj,
          //   file_id: files[0].id,
          //   option_value_title: files[0].label,
          //   option_image_path: files[0].source,
          //   option_value_price: '',
          //   preview_image_file: '',
          // }
        }
      }

        console.log('the_obj', the_obj)


      dispatchOptionModalData({ ...the_obj })

    } else {
      dispatchOptionModalData({ isActive: false })
    }
  }, [files, productData])

  
  const {selectedResources, allResourcesSelected, handleSelectionChange, clearSelection} = useIndexResourceState(productData.variants, false)


  // useEffect(() => {
  //   getColors()
  // }, [])


  useEffect(() => {
    console.log('useEffect loaderData', loaderData);

    dispatchProductData({
      id: loaderData.product._id,
      product_id: loaderData.product.product_id,
      product_title: loaderData.product.product_title,
      options: !!loaderData?.product?.options ? loaderData.product.options : [],
      variants: !!loaderData?.product?.variants ? loaderData.product.variants : [],
    })

    if (!!loaderData?.product?.options && !!Object.keys(loaderData.product.options).length) {

      // const enabledOpsArr = Object.keys(loaderData.product.options).map(opKey => opKey)

      // const enabledOps = enabledOpsArr.reduce((a, v) => ({ ...a, [v]: !!loaderData.product.options[v].length ? true : false }), {})

      // setEnabledOptions((prevEnabledOptions) => ({
      //   ...prevEnabledOptions,
      //   ...enabledOps
      // }))

      // const newMainImage = enabledOpsArr.reduce((a, v) => {
      //   return { ...a, [v]: !!loaderData.product.options[v].length ? loaderData.product.options[v][loaderData.product.options[v].length - 1].preview_image_path : '' }
      // }, {})

      const mainImages = {}
      for (let index = 0; index < loaderData.product.options.length; index++) {
        const cat = loaderData.product.options[index]
        if (!!cat?.option_values?.length) {
          mainImages[index] = cat.option_values[cat.option_values.length - 1]?.preview_image_path
        }
      }
      if (!Object.keys(previewMainImages).length) {
        setMainImage(prevMainImage => ({
          ...prevMainImage,
          ...mainImages
        }))
      }

    }

    getColors()
  }, [loaderData])


  useEffect(() => {
    if (!actionData?.success && !!actionData?.message) {
      shopify.toast.show(actionData.message)
    } else if (!!actionData?.success && !!actionData?.message) {
      if (!!actionData?.product) {
        dispatchProductData({
          id: actionData.product._id,
          product_id: actionData.product.product_id,
          product_title: actionData.product.product_title
        })
      }

      shopify.toast.show(actionData.message)
    }
  }, [actionData])


  const getColors = async () => {
    const colorsData = await fetch('/admin/files').then((response) => response.json())

    console.log('colorsData', colorsData)

    if (!!colorsData.data.length) {

      const colorsStateData = colorsData.data.map(cd => ({
        id: cd._id,
        label: cd.name,
        value: cd._id,
        type: cd.type,
        prefix: <Thumbnail size="extraSmall" source={`${cd.filePath}`} />,
        source: `${cd.filePath}`
      }))

      setFiles(colorsStateData)
    }

  }

  const selectProduct = async () => {

    let resourcePickerOptions = {
      type: 'product'
    }

    if (!!productData?.product_id) {
      resourcePickerOptions.selectionIds = [{
        id: productData.product_id
      }]
    }

    const selected = await shopify.resourcePicker(resourcePickerOptions)
    console.log('selected', selected)
    if (!!selected) {
      dispatchProductData({
        product_id: selected?.[0]?.id,
        product_title: selected?.[0]?.title,
        product_image: !!selected?.[0]?.images?.[0]?.originalSrc ? selected[0].images[0].originalSrc : "",
        product_price: selected?.[0]?.variants?.[0]?.price
      })
    }
  }

  const changeMainImage = (categoryIndex, optionObj) => {
    setMainImage((previewMainImages) => {
      return {
        ...previewMainImages,
        [categoryIndex]: optionObj.preview_image_path
      }
    })
  }

  const handleProductDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => dispatchOptionModalData({ preview_image_file: acceptedFiles[0] }),
    [],
  )

  const removeColorHandler = (option_id, option_value_id) => {
    const formData = new FormData()
    formData.append("document_id", productData.id)
    formData.append("delete", 'option')
    formData.append("option_id", option_id)
    formData.append("option_value_id", option_value_id)

    submit(formData, { replace: true, method: "DELETE" })
  }

  const editColorHandler = ( option_id, option_value_id ) => {
    toggleOptionModalActive({ option_id, option_value_id })
  }

  const CpcustomHolder = ({ categoryIndex, option_id, option_title, option_type, category_options }) => {

    console.log('CpcustomHolder categoryIndex, option_id, option_title, option_type, category_options', categoryIndex, option_id, option_title, option_type, category_options)

    return (
      <LegacyCard
        sectioned
        title={option_title}
        actions={[
          {
            content: "Edit",
            onAction: (event) => {
              optionModalToggleActive({
                option_id,
                option_title,
                option_type,
                isActive: true
              })
            },
            disabled: isLoading
          },
          {
            content: "Delete",
            onAction: (event) => {
              const formData = new FormData()
              formData.append("document_id", productData.id)
              formData.append("delete", "category")
              formData.append("option_id", option_id)

              submit(formData, { replace: true, method: "DELETE" })
            },
            disabled: isLoading
          }
        ]}
      >
        <InlineStack gap={300}>
          {!!category_options && category_options.map((mp => {
            return (
              <Tooltip
                key={mp.option_value_title}
                content={mp.option_value_title}
                zIndexOverride={0}
              >
                <div style={{ position: 'relative' }}>
                  <Button
                    onClick={() => changeMainImage(categoryIndex, mp)}
                    disabled={isLoading}
                  >
                    {
                      !!mp?.option_image_path
                      ?
                      <Thumbnail size="extraSmall" source={mp.option_image_path} />
                      :
                      mp.option_value_title
                    }
                  </Button>

                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      editColorHandler(option_id, mp.option_value_id)
                    }}
                  >
                    <Icon source={CircleDotsMajor} />
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      removeColorHandler(option_id, mp.option_value_id)
                    }}
                  >
                    <Icon source={CircleCancelMajor} />
                  </div>
                </div>
              </Tooltip>
            )
          }))}

          <Button
            onClick={() => {
              toggleOptionModalActive({ isActive: true, option_id })
            }}
            disabled={isLoading}
          >
            Add New
          </Button>

        </InlineStack>
      </LegacyCard>
    )
  }

  const handleCategoryModalSave = () => {
    const formData = new FormData()
    formData.append("document_id", productData.id)
    formData.append("option_title", categoryModalData.option_title)
    formData.append("option_type", categoryModalData.option_type)

    if (!!categoryModalData.option_id) {
      formData.append("update", "category")
      formData.append("option_id", categoryModalData.option_id)
      submit(formData, { replace: true, method: "PATCH" })
    } else {
      formData.append("create", "category")
      submit(formData, { replace: true, method: "POST" })
    }
    optionModalToggleActive({ isActive: false })
  }

  const handleOptionModalSaveOrUpdate = () => {
    // console.log('optionModalData', optionModalData)

    const formData = new FormData()

    formData.append("document_id", productData.id)
    formData.append("option_id", optionModalData.option_id)
    formData.append("file_id", optionModalData.file_id)
    formData.append("option_value_title", optionModalData.option_value_title)
    formData.append("option_image_path", optionModalData.option_image_path)
    formData.append("option_value_price", optionModalData.option_value_price)

    if ( !!optionModalData.preview_image_file ) {
      formData.append("preview_image_file", optionModalData.preview_image_file)
    }

    if ( !!optionModalData?.option_value_id ) {
      formData.append("option_value_id", optionModalData.option_value_id)
      formData.append("update", "option")
      submit(formData, { replace: true, method: "PATCH", encType: "multipart/form-data" })
    } else {
      formData.append("create", "option")
      submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
    }

    console.log('handleOptionModalSaveOrUpdate formData', formData)

    toggleOptionModalActive()
  }

  const onProductDataSaveHandler = () => {
    const formData = new FormData()
    formData.append('product_id', productData.product_id)
    formData.append('product_title', productData.product_title)

    submit(formData, { replace: true, method: "POST" })
  }

  const onProductDataUpdateHandler = () => {
    const formData = new FormData()

    formData.append('id', productData.id)
    formData.append('product_id', productData.product_id)
    formData.append('product_title', productData.product_title)
    formData.append('product_image', productData.product_image)
    formData.append('product_price', productData.product_price)

    submit(formData, { replace: true, method: "PATCH" })
  }

  const handleModalImageClick = (fileObj = null) => {
    console.log('handleModalImageClick fileObj optionModalData', fileObj, optionModalData)
    if (!!fileObj) {
      dispatchOptionModalData({ file_id: fileObj.id, option_image_path: fileObj.source })
    } else {
      dispatchOptionModalData({ file_id: null })
    }
  }


  return (
    <Page
      backAction={{ content: "Products", url: "/app" }}
      title={!!productData?.id ? productData.product_title : "Setup new product"}
      // fullWidth
      primaryAction={{
        content: !!productData?.id ? "Update" : 'Save',
        onAction: !!productData?.id ? onProductDataUpdateHandler : onProductDataSaveHandler,
        disabled: !!productData?.product_id ? false : true,
        disabled: isLoading
      }}
      secondaryActions={[{
        content: !!productData?.product_id ? 'Change Product' : 'Select Product',
        onAction: selectProduct,
        disabled: isLoading
      }]}
    >
      <BlockStack gap="500">
        <Layout>

          <Layout.Section>


            <LegacyCard title="Options">
              {/* <div className="_Divider_138lb_3"> */}
                <Divider />
              {/* </div> */}
              <div className="addnewoptionwrapper">
                <Box>
                  <span>
                    <BlockStack inlineAlign="start">
                      <Button
                        variant="plain"
                        icon={PlusMinor}
                        onClick={() => { optionModalToggleActive({ isActive: true }) }}
                      >
                        Add option
                      </Button>
                    </BlockStack>
                  </span>
                </Box>
              </div>
            </LegacyCard>

            {/* {
              !!productData?.id &&
              <LegacyCard
                sectioned
                title="Options"
                actions={[{
                  content: "Add Option",
                  onAction: (event) => {
                    optionModalToggleActive({ isActive: true })
                  }
                }]}
              >
                <BlockStack>
                  <InlineStack gap={400}>
                    {productData.options.map(po => {
                      return (
                        <Checkbox
                          key={po.value}
                          label={po.label}
                          checked={enabledOptions[po.value]}
                          onChange={(isChecked) => {
                            // setEnabledOptions((prevOptions) => {
                            //   return {
                            //     ...prevOptions,
                            //     [po.value]: isChecked
                            //   }
                            // })
                          }}
                        />
                      )
                    })}
                  </InlineStack>
                </BlockStack>
              </LegacyCard>
            } */}


            {productData.options.map((cat, categoryIndex) => {
              return (
                <CpcustomHolder
                  key={cat.option_id}
                  categoryIndex={categoryIndex}
                  option_id={cat.option_id}
                  option_title={cat.option_title}
                  option_type={cat.option_type}
                  category_options={cat.option_values}
                />
              )
            })}



            <div className="eQ_yd">
              <LegacyCard
                title="Variants"
                actions={[
                  {
                    content: 'Generate Variants',
                    onAction: () => {
                      // console.log('productData.options', productData.options)
                      const the_variations = generateVariations(productData.options)
                      if (!the_variations.length) {
                        shopify.toast.show('No variants can be created!')
                        return
                      }

                      // console.log('productData.variants', productData.variants)

                      const merged_variants = the_variations.map(the_variation => {
                        const found_old_variant = productData.variants.find(pdv => pdv.variant_title === the_variation.variant_title)
                        if (!!found_old_variant) {
                          return found_old_variant
                        } else {
                          return the_variation
                        }
                      })

                      // console.log('merged_variants', merged_variants)

                      const formData = new FormData()
                      formData.append("update", "variants")
                      formData.append("document_id", productData.id)
                      formData.append("variants", JSON.stringify(merged_variants))
                      submit(formData, { replace: true, method: "PATCH" })
                    },
                    disabled: isLoading
                  },
                  {
                    content: 'Add Variant',
                    onAction: () => { navigate(`/app/variant/${productData.id}/new`) },
                    disabled: isLoading
                  }
                ]}
              >
                <div className="gaCeK" style={{ marginBlockStart: 'var(--p-space-400)' }}>
                  <Divider borderColor="border" />
                </div>
                <div className="udaqm">
                  <IndexTable
                    resourceName={{
                      singular: 'variant',
                      plural: 'variants'
                    }}
                    itemCount={productData.variants.length}
                    selectedItemsCount={ allResourcesSelected ? 'All' : selectedResources.length }
                    onSelectionChange={() => {}}
                    headings={[
                      { title: '' },
                      { title: 'Variant' },
                      { title: 'Price' },
                      { title: '' },
                    ]}
                  >
                    {productData.variants.map(({ variant_id, variant_title, variant_image_path, variant_price }, index) => {
                      return (
                        <IndexTable.Row
                          id={variant_id}
                          key={variant_id}
                          selected={selectedResources.includes(variant_id)}
                          position={index}
                        >
                          <IndexTable.Cell>
                            {
                              !!variant_image_path
                              ?
                              <div className="variant-cell">
                                <Thumbnail
                                  source={`${variant_image_path}`}
                                />
                              </div>
                              :
                              <Icon source={AddImageMajor} />
                            }
                          </IndexTable.Cell>
                          <IndexTable.Cell>{variant_title}</IndexTable.Cell>
                          <IndexTable.Cell>
                            {variant_price}
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            <div className="u9Xhb">
                              <ButtonGroup>
                                  <Button
                                    onClick={() => {
                                      navigate(`/app/variant/${productData.id}/${variant_id}`)
                                    }}
                                    disabled={isLoading}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      const formData = new FormData()
                                      formData.append('document_id', productData.id)
                                      formData.append("variant_id", variant_id)
                                      submit(formData, {
                                        action: `/app/variant/${productData.id}/${variant_id}`,
                                        method: "DELETE",
                                        replace: true,
                                      })
                                    }}
                                    disabled={isLoading}
                                  >
                                    <Icon source={DeleteMajor} />
                                  </Button>
                              </ButtonGroup>
                            </div>
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      )
                    })}
                  </IndexTable>
                </div>
              </LegacyCard>
            </div>



          </Layout.Section>

          {/* <Layout.Section variant="oneHalf">
            <Card>
              <div style={{
                position: 'relative',
                height: '400px'
              }}>

                {Object.keys(previewMainImages).map((mainImageKey) => {
                  return (
                    <img src={previewMainImages[mainImageKey]} style={{
                      width: '100%',
                      height: 'auto',
                      position: 'absolute'
                    }} />
                  )
                })}

              </div>
            </Card>
          </Layout.Section> */}

        </Layout>
      </BlockStack>

      <Modal
        open={categoryModalData.isActive}
        onClose={() => {
          optionModalToggleActive({ isActive: false })
        }}
        title={ `${ !!categoryModalData.option_id ? 'Edit' : 'Add' } Custom Option` }
        primaryAction={{
          content: !!categoryModalData.option_id ? 'Update' : 'Save',
          onAction: handleCategoryModalSave,
        }}
        secondaryActions={{
          content: 'Cancel',
          onAction: () => {
            optionModalToggleActive({ isActive: false })
          }
        }}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Option Title"
              value={categoryModalData.option_title}
              onChange={(value) => {
                optionModalToggleActive({ option_title: value })
              }}
            />
            {console.log('categoryModalData.option_type', categoryModalData)}
            <Select
              label="Option Type"
              options={[
                { label: 'Swatch', value: 'swatch' },
                { label: 'Dropdown', value: 'select' },
                { label: 'Range', value: 'range' },
              ]}
              onChange={(value) => {
                optionModalToggleActive({ option_type: value })
              }}
              value={categoryModalData.option_type}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        size="large"
        open={optionModalData.isActive}
        onClose={toggleOptionModalActive}
        title="Select Option Image or Upload a new option image for this option"
        primaryAction={{
          content: !!optionModalData.option_value_id ? 'Update' : 'Save',
          onAction: handleOptionModalSaveOrUpdate
        }}
        secondaryActions={{
          content: 'Cancel',
          onAction: toggleOptionModalActive
        }}
      >

        <Modal.Section>
          <LegacyStack vertical>
            {/* <Select
              label="Select Color"
              options={files}
              onChange={op => handleSelectChange(files.find(clr => clr.id === op))}
              value={!!optionModalData.file_id ? optionModalData.file_id : (!!files?.[0]?.id ? files[0].id : '')}
            /> */}

            <TextField
              label="Option Value Title"
              type="text"
              value={optionModalData.option_value_title}
              onChange={val => dispatchOptionModalData({ option_value_title: val })}
              autoComplete="off"
            />

            {/* <TextField
              label="Price"
              type="number"
              value={optionModalData.option_value_price}
              onChange={val => dispatchOptionModalData({ option_value_price: val })}
              autoComplete="off"
            /> */}

            

            {/* <DropZone
              accept="image/*"
              errorOverlayText="File type must be image"
              type="image"
              allowMultiple={false}
              onDrop={handleProductDropZoneDrop}
            > */}
              {/* {
                  (optionModalData.preview_image_file) &&
                  <LegacyStack>
                      <img src={window.URL.createObjectURL(optionModalData.preview_image_file)} style={{
                        width: '60%',
                        height: 'auto'
                      }} />
                      <div>
                          {optionModalData.preview_image_file.name}{' '}
                          <Text variant="bodySm" as="p">
                              {optionModalData.preview_image_file.size} bytes
                          </Text>
                      </div>
                  </LegacyStack>
              }
              {
                  (!optionModalData.preview_image_file && optionModalData.option_image_path) &&
                  <LegacyStack>
                      <img src={optionModalData.option_image_path} style={{
                        width: '60%',
                        height: 'auto'
                      }} />
                      <div>
                          {optionModalData.option_image_path}
                      </div>
                  </LegacyStack>
              }
              {(!optionModalData.preview_image_file) && (!optionModalData.option_image_path) && <DropZone.FileUpload />} */}

              <div className="Image-Container">
                
                <button type="button" className="DropZone-Container" onClick={handleModalImageClick}>
                  <DropZone
                    accept="image/*"
                    errorOverlayText="File type must be image"
                    type="image"
                    allowMultiple={false}
                    onDrop={handleProductDropZoneDrop}
                  >
                    
                    {
                      (optionModalData.preview_image_file) &&
                      <LegacyStack>
                          <img src={window.URL.createObjectURL(optionModalData.preview_image_file)} style={{
                            // width: '60%',
                            // height: 'auto'
                          }} />
                          {/* <div>
                              {optionModalData.preview_image_file.name}{' '}
                              <Text variant="bodySm" as="p">
                                  {optionModalData.preview_image_file.size} bytes
                              </Text>
                          </div> */}
                      </LegacyStack>
                    }

                    {/* <DropZone.FileUpload /> */}
                    {(!optionModalData.preview_image_file) && (!optionModalData.option_image_path) && <DropZone.FileUpload />}
                  </DropZone>
                </button>

                {files.map(fl => {
                  return (
                    <button className={`Image-Item ${(fl.id === optionModalData.file_id) && 'Image-Item__Selected'}`} type="button" onClick={() => handleModalImageClick(fl)}>
                      <div className={`CAUQv ${(fl.id === optionModalData.file_id) && 'e97eu'}`}></div>
                      <div className="OT4Wj">
                        <img className="Nm7Sx" src={fl.source} alt={fl.label} />
                      </div>
                      <div className="Image-Checkbox__Container">
                        {
                          (fl.id === optionModalData.file_id) &&
                          <span className="Image-Checkbox__Container__Span">
                            <img src={CircleTick} alt="" />
                          </span>
                        }
                      </div>
                    </button>
                  )
                })}

              </div>

            {/* </DropZone> */}
          </LegacyStack>
        </Modal.Section>
      </Modal>
    </Page>
  )
}