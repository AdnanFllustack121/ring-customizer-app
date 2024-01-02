import { forwardRef, useCallback, useEffect, useReducer, useState } from "react";
import { json, unstable_composeUploadHandlers, unstable_createFileUploadHandler, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
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
} from "@shopify/polaris";
import { CircleCancelMajor, CircleDotsMajor } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { Products, Session } from "../db.server";
import { deleteFile, makeid } from "../utils";

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
              directory: 'public/uploads/images',
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
          const category_id = formDataToCreate.get("category_id")
          const color_id = formDataToCreate.get("color_id")
  
          const option_title = formDataToCreate.get("option_title")
          const option_image_path = formDataToCreate.get("option_image_path")
          const option_price = formDataToCreate.get("option_price")
          const preview_image_file = formDataToCreate.get("preview_image_file")
  
          const foundProduct = await Products.findById(document_id)

          const obj = {
            color_id,
            option_id: makeid(24),
            option_title,
            option_image_path,
            option_price,
            preview_image_path: !!preview_image_file ? `/uploads/images/${preview_image_file.name}` : '',
          }

          const categoriesNew = foundProduct.categories.map(cat => {
            if (cat.category_id === category_id) {

              if (!!cat?.options?.length) {
                return {
                  ...cat,
                  options: [
                    ...cat.options,
                    obj
                  ]
                }
              } else {
                return {
                  ...cat,
                  options: [obj]
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
            categories: categoriesNew
          })

        }

      } else {
        const formData = await request.formData()
        const createType = formData.get("create")
  
        const product_id = formData.get("document_id")
  
        const product_title = formData.get("product_title")
  
        const foundProduct = await Products.findById(product_id)
  
        const categoryTitle = formData.get("category_title")
  
        if (!!foundProduct) {
          if (createType === "category") {
  
            const newCategory = {
              category_id: makeid(24),
              category_title: categoryTitle
            }
  
            if (!!foundProduct?.categories) {
              const isProductUpdated = await Products.findOneAndUpdate({
                _id: product_id
              }, {
                categories: [...foundProduct.categories, newCategory]
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
                categories: [newCategory]
              })
              return json({
                success: true,
                product: isProductUpdated,
                message: "New Category Added!"
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
              directory: 'public/uploads/images',
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

        if (updateType === 'option') {

          const category_id = formDataToUpdate.get("category_id")

          console.log('category_id', category_id)

          const color_id = formDataToUpdate.get("color_id")

          const option_id = formDataToUpdate.get("option_id")
          const option_title = formDataToUpdate.get("option_title")
          const option_image_path = formDataToUpdate.get("option_image_path")
          const option_price = formDataToUpdate.get("option_price")
          const preview_image_file = formDataToUpdate.get("preview_image_file")

          console.log('preview_image_file', preview_image_file, !!preview_image_file)

          const optionObjToUpdate = {
            color_id,
            option_id,
            option_title,
            option_image_path,
            option_price
          }

          if (!!preview_image_file) {
            optionObjToUpdate.preview_image_path = !!preview_image_file ? `/uploads/images/${preview_image_file.name}` : ''
          }

          console.log('optionObjToUpdate', optionObjToUpdate)

          const categoryOptionToUpdate = found_product.categories.map(cat => {
            if (cat.category_id === category_id) {

              const optionsModified = cat.options.map(opt => {
                if (opt.option_id === option_id) {

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
                options: optionsModified
              }
            } else {
              return cat
            }
          })

          console.log('categoryOptionToUpdate', JSON.stringify(categoryOptionToUpdate))

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            categories: categoryOptionToUpdate
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

          const category_id = formData.get('category_id')
          const category_title = formData.get('category_title')

          const updatedCategories = found_product.categories.map(cat => {
            if (category_id == cat.category_id) {
              return {
                ...cat,
                category_title
              }
            } else {
              return cat
            }
          })

          const isProductUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            categories: updatedCategories
          })

        } else if (!!updateType && updateType === 'option') {
          // Update Option


          
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
        const category_id = formDataToDelete.get("category_id")

        const categoryIndex = productToDeleteOptionColor.categories.findIndex(cat => cat.category_id === category_id)

        if (
          (!!categoryIndex || (categoryIndex === 0)) &&
          (
            (!!productToDeleteOptionColor.categories[categoryIndex]?.options && !productToDeleteOptionColor.categories[categoryIndex].options.length) ||
            (!productToDeleteOptionColor.categories[categoryIndex]?.options)
          )
        ) {
          productToDeleteOptionColor.categories.splice(categoryIndex, 1)
          const isProductOptionUpdated = await Products.findOneAndUpdate({
            _id: document_id
          }, {
            categories: productToDeleteOptionColor.categories
          })
        }

      } else if (deleteType === "option") {
        // Delete Option
        const category_id = formDataToDelete.get("category_id")
        const option_id = formDataToDelete.get("option_id")

        const categoryIndex = productToDeleteOptionColor.categories.findIndex(cat => cat.category_id === category_id)
        console.log('categoryIndex', categoryIndex)

        const optionIndex = productToDeleteOptionColor.categories[categoryIndex].options.findIndex(opt => opt.option_id === option_id)
        console.log('optionIndex', optionIndex)

        // Delete the file first
        if (!!productToDeleteOptionColor.categories[categoryIndex].options[optionIndex].preview_image_path) {
          await deleteFile(productToDeleteOptionColor.categories[categoryIndex].options[optionIndex].preview_image_path)
        }

        productToDeleteOptionColor.categories[categoryIndex].options.splice(optionIndex, 1)

        const isProductOptionUpdated = await Products.findOneAndUpdate({
          _id: document_id
        }, {
          categories: productToDeleteOptionColor.categories
        })

      } else {
        const optionType = formDataToDelete.get("optionType")
        const option_title = formDataToDelete.get("option_title")
  
        const optionArr = productToDeleteOptionColor.options[optionType]
        const optionIndex = optionArr.findIndex(o => o.option_title === option_title)
  
        // Delete the file first
        if (!!optionArr[optionIndex].preview_image_path) {
          await deleteFile(optionArr[optionIndex].preview_image_path)
        }
  
        optionArr.splice(optionIndex, 1)
  
        const newOptions = {
          ...productToDeleteOptionColor.options,
          [optionType]: optionArr
        }
  
        const isProductOptionUpdated = await Products.findOneAndUpdate({
          _id: document_id
        }, {
          options: newOptions
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
              category_id: '',
              category_title: ''
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
          category_id: '',
          color_id: '',
          option_id: '',
          option_title: '',
          option_image_path: '',
          option_price: '',
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

      const new_state = {
        ...state,
        options: {
          ...state.options,
          [action_option]: [
            ...state.options[action_option],
            action.data
          ]
        }
      }
      return { ...new_state }

    case "REMOVE":

      let newOptions = state.options[action.option].filter(soao => soao.name !== action.name)

      const new_state_after_removal = {
        ...state,
        options: {
          ...state.options,
          [action.option]: newOptions
        }
      }

      return { ...new_state_after_removal }

    default:
      return { ...state, ...action }
  }
}

export default function Index() {

  const loaderData = useLoaderData()
  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();

  const isLoading = ["loading", "submitting"].includes(navigation.state)

  const [colors, setColors] = useState([])

  const [productData, dispatchProductData] = useReducer(productDataReducer, {
    id: '',
    product_id: '',
    product_title: '',
    product_image: '',
    product_price: '',
    categories: []
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
    category_id: '',
    category_title: '',
  })

  const optionModalToggleActive = useCallback(({...args}) => {

    if (args?.isActive === false) {
      args = {
        ...args,
        category_id: '',
        category_title: '',
      }
    }

    dispatchCategoryModalData(args)
  }, [])


  const [optionModalData, dispatchOptionModalData] = useReducer(optionModalReducer, {
    isActive: false,
    category_id: '',
    color_id: '',
    option_id: '',
    option_title: '',
    option_image_path: '',
    option_price: '',
    preview_image_file: '',
    preview_image_path: ''
  })

  const handleSelectChange = useCallback(
    (value) => dispatchOptionModalData({ color_id: value.id, option_title: value.label, option_image_path: value.source }),
    [],
  )


  const toggleOptionModalActive = useCallback((args = {}) => {

    console.log('args', args)

    const { isActive, category_id, option_id } = args

    if (!!category_id) {

      let the_obj = {
        isActive: true,
        category_id: category_id
      }

      console.log('colors', colors)

      if (!!colors && !!colors.length) {

        if (!!option_id) {
          console.log('option_id', option_id)
          console.log('productData', productData)
          console.log('productData.categories', productData.categories)
          const categoryObj = productData.categories.find(cat => cat.category_id === category_id)
          console.log('categoryObj', categoryObj)

          const optionObj = categoryObj.options.find(opt => opt.option_id === option_id)

          the_obj = {
            ...the_obj,
            color_id: optionObj.color_id,
            option_id: option_id,
            option_title: optionObj.option_title,
            option_image_path: optionObj.option_image_path,
            option_price: optionObj.option_price,
            preview_image_path: optionObj.preview_image_path
          }
        } else {
          the_obj = {
            ...the_obj,
            color_id: colors[0].id,
            option_title: colors[0].label,
            option_image_path: colors[0].source,
            option_price: '',
            preview_image_file: '',
          }
        }

        console.log('the_obj', the_obj)
      }

      dispatchOptionModalData({ ...the_obj })

    } else {
      dispatchOptionModalData({ isActive: false })
    }
  }, [colors, productData])


  useEffect(() => {
    // if (productId) {
    //   // shopify.toast.show("Product created")
    // }
    getColors()
  }, [])


  useEffect(() => {
    dispatchProductData({
      id: loaderData.product._id,
      product_id: loaderData.product.product_id,
      product_title: loaderData.product.product_title,
      categories: !!loaderData?.product?.categories ? loaderData.product.categories : [],
    })

    if (!!loaderData?.product?.categories && !!Object.keys(loaderData.product.categories).length) {

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
      for (let index = 0; index < loaderData.product.categories.length; index++) {
        const cat = loaderData.product.categories[index]
        if (!!cat?.options?.length) {
          mainImages[index] = cat.options[cat.options.length - 1]?.preview_image_path
        }
      }
      if (!Object.keys(previewMainImages).length) {
        setMainImage(prevMainImage => ({
          ...prevMainImage,
          ...mainImages
        }))
      }
    }
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
    const colorsData = await fetch('/admin/colors').then((response) => response.json())

    if (!!colorsData.data.length) {

      const colorsStateData = colorsData.data.map(cd => ({
        id: cd._id,
        label: cd.name,
        value: cd._id,
        type: cd.type,
        prefix: <Thumbnail size="extraSmall" source={`${cd.filePath}`} />,
        source: `${cd.filePath}`
      }))

      setColors(colorsStateData)
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
    dispatchProductData({
      product_id: selected?.[0]?.id,
      product_title: selected?.[0]?.title,
      product_image: !!selected?.[0]?.images?.[0]?.originalSrc ? selected[0].images[0].originalSrc : "",
      product_price: selected?.[0]?.variants?.[0]?.price
    })
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

  const removeColorHandler = (category_id, option_id) => {
    const formData = new FormData()
    formData.append("document_id", productData.id)
    formData.append("delete", 'option')
    formData.append("category_id", category_id)
    formData.append("option_id", option_id)

    submit(formData, { replace: true, method: "DELETE" })
  }

  const editColorHandler = ( category_id, option_id ) => {
    toggleOptionModalActive({ category_id, option_id })
  }

  const CpcustomHolder = ({ categoryIndex, category_id, category_title, category_options }) => {

    console.log('CpcustomHolder categoryIndex, category_id, category_title, category_options', categoryIndex, category_id, category_title, category_options)

    return (
      <LegacyCard
        sectioned
        title={category_title}
        actions={[
          {
            content: "Edit",
            onAction: (event) => {
              optionModalToggleActive({
                category_id,
                category_title,
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
              formData.append("category_id", category_id)

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
                key={mp.option_title}
                content={mp.option_title}
                zIndexOverride={0}
              >
                <div style={{ position: 'relative' }}>
                  <Button
                    onClick={() => changeMainImage(categoryIndex, mp)}
                    disabled={isLoading}
                  >
                    {/* <Thumbnail size="extraSmall" source={mp.option_image_path} /> */}
                    {mp.option_title}
                  </Button>

                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      editColorHandler(category_id, mp.option_id)
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
                      removeColorHandler(category_id, mp.option_id)
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
              toggleOptionModalActive({ isActive: true, category_id })
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
    formData.append("category_title", categoryModalData.category_title)

    if (!!categoryModalData.category_id) {
      formData.append("update", "category")
      formData.append("category_id", categoryModalData.category_id)
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
    formData.append("category_id", optionModalData.category_id)
    formData.append("color_id", optionModalData.color_id)
    formData.append("option_title", optionModalData.option_title)
    formData.append("option_image_path", optionModalData.option_image_path)
    formData.append("option_price", optionModalData.option_price)

    if ( !!optionModalData.preview_image_file ) {
      formData.append("preview_image_file", optionModalData.preview_image_file)
    }

    if ( !!optionModalData?.option_id ) {
      formData.append("option_id", optionModalData.option_id)
      formData.append("update", "option")
      // submit(formData, { replace: true, method: "PATCH", encType: "multipart/form-data" })
    } else {
      formData.append("create", "option")
      submit(formData, { replace: true, method: "POST", encType: "multipart/form-data" })
    }

    console.log('formData', formData)

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

  return (
    <Page
      backAction={{ content: "Products", url: "/app" }}
      title={!!productData?.id ? "Update product" : "Setup new product"}
      fullWidth
      primaryAction={{
        content: !!productData?.id ? "Update" : 'Save',
        onAction: !!productData?.id ? onProductDataUpdateHandler : onProductDataSaveHandler,
        disabled: !!productData?.product_id ? false : true,
        disabled: isLoading
      }}
    >
      <BlockStack gap="500">
        <Layout>

          <Layout.Section>
            <Card>
              <Button
                onClick={selectProduct}
                disabled={isLoading}
              >
                {
                  !!productData?.product_id
                  ?
                  'Change Product'
                  :
                  'Select Product'
                }
              </Button>
              {
                !!productData?.product_title &&
                <Text as="h5" variant="headingLg">{productData.product_title}</Text>
              }
            </Card>

            {
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
                {/* <BlockStack>
                  <InlineStack gap={400}>
                    {productData.categories.map(cat => {
                      return (
                        <Checkbox
                          key={cat.id}
                          label={cat.title}
                          // checked={enabledOptions[cat.value]}
                          onChange={(isChecked) => {
                            // setEnabledOptions((prevOptions) => {
                            //   return {
                            //     ...prevOptions,
                            //     [cat.value]: isChecked
                            //   }
                            // })
                          }}
                        />
                      )
                    })}
                  </InlineStack>
                </BlockStack> */}
              </LegacyCard>
            }

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


            {productData.categories.map((cat, categoryIndex) => {
              return <CpcustomHolder key={cat.category_id} categoryIndex={categoryIndex} category_id={cat.category_id} category_title={cat.category_title} category_options={cat.options} />
            })}

          </Layout.Section>

          <Layout.Section variant="oneHalf">
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
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Modal
        open={categoryModalData.isActive}
        onClose={() => {
          optionModalToggleActive({ isActive: false })
        }}
        title={`${!!categoryModalData.category_id ? 'Edit' : 'Add'} Custom Option`}
        primaryAction={{
          content: !!categoryModalData.category_id ? 'Update' : 'Save',
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
          <TextField
            label="Title"
            value={categoryModalData.category_title}
            onChange={(value) => {
              optionModalToggleActive({ category_title: value })
            }}
          />
        </Modal.Section>
      </Modal>

      <Modal
        size="large"
        open={optionModalData.isActive}
        onClose={toggleOptionModalActive}
        title="Select Color and Upload product image for this color"
        primaryAction={{
          content: !!optionModalData.option_id ? 'Update' : 'Save',
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
              options={colors}
              onChange={op => handleSelectChange(colors.find(clr => clr.id === op))}
              value={!!optionModalData.color_id ? optionModalData.color_id : (!!colors?.[0]?.id ? colors[0].id : '')}
            /> */}

            <TextField
              label="Option Name"
              type="text"
              value={optionModalData.option_title}
              onChange={val => dispatchOptionModalData({ option_title: val })}
              autoComplete="off"
            />

            <TextField
              label="Price"
              type="number"
              value={optionModalData.option_price}
              onChange={val => dispatchOptionModalData({ option_price: val })}
              autoComplete="off"
            />

            

            {/* <DropZone
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
                  (!optionModalData.preview_image_file && optionModalData.preview_image_path) &&
                  <LegacyStack>
                      <img src={optionModalData.preview_image_path} style={{
                        width: '60%',
                        height: 'auto'
                      }} />
                      <div>
                          {optionModalData.preview_image_path}
                      </div>
                  </LegacyStack>
              }

              {(!optionModalData.preview_image_file) && (!optionModalData.preview_image_path) && <DropZone.FileUpload />}
            </DropZone> */}
          </LegacyStack>
        </Modal.Section>
      </Modal>
    </Page>
  )
}