import { useEffect, useState } from "react";
import { json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
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
  Pagination,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { Products } from "../db.server";

import indexStyles from "~/styles/index.css";

export const links = () => [
  { rel: "stylesheet", href: indexStyles },
]

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request)

  const url        = new URL(request.url)
  const prevOrNext = url.searchParams.get("prevOrNext")
  const cursor     = url.searchParams.get("cursor")
  console.log('searchParams', prevOrNext, cursor)

  // Get total count of records
  const totalProducts = await Products.countDocuments({
    $or: [
      { shop: { $exists: false } },
      { shop: session.shop }
    ]
  })

  let limit = 5
  let currentPage = !!cursor ? cursor : 1
  let skip = currentPage - 1
  let remaining = 0

  if (cursor) {
    skip = limit * (cursor - 1)

    remaining = totalProducts - (limit * cursor)
  } else {
    remaining = totalProducts - (limit * 1)
  }

  const products = await Products.find(
    {
      $or: [
        { shop: { $exists: false } },
        { shop: session.shop }
      ]
    },
    "_id product_id product_title product_image product_price product_sku product_type",
    {
      skip: skip,
      limit: limit
    }
  )

  return json({
    success: true,
    products: products,
    pageInfo: {
      hasPreviousPage: (currentPage > 1) ? true : false,
      hasNextPage: (remaining > 0) ? true : false,
      startCursor: (currentPage > 1) ? currentPage - 1 : "",
      endCursor: (remaining > 0) ?  Number(currentPage) + 1 : ""
    }
  })
}

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // const color = ["Red", "Orange", "Yellow", "Green"][
  //   Math.floor(Math.random() * 4)
  // ];
  // const response = await admin.graphql(
  //   `#graphql
  //     mutation populateProduct($input: ProductInput!) {
  //       productCreate(input: $input) {
  //         product {
  //           id
  //           title
  //           handle
  //           status
  //           variants(first: 10) {
  //             edges {
  //               node {
  //                 id
  //                 price
  //                 barcode
  //                 createdAt
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }`,
  //   {
  //     variables: {
  //       input: {
  //         title: `${color} Snowboard`,
  //         variants: [{ price: Math.random() * 100 }],
  //       },
  //     },
  //   }
  // );
  // const responseJson = await response.json();

  // return json({
  //   product: responseJson.data.productCreate.product,
  // });

  switch (request.method) {

    case "POST":
      const formData = await request.formData()
      console.log('formData', formData)
      const product_id    = formData.get("product_id")
      const product_title = formData.get("product_title")
      const product_image = formData.get("product_image")
      const product_price = formData.get("product_price")
      const product_sku   = formData.get("product_sku")
      const product_type  = formData.get("product_type")

      const doExists = await Products.findOne({ product_id })
      if (doExists) {
        return json({
          success: false,
          message: "Already Exists"
        })
      } else {
        const isProductCreated = await Products.create({
          shop: session.shop,
          product_id,
          product_title,
          product_image,
          product_price,
          product_sku,
          product_type
        })

        if (!!isProductCreated && !!isProductCreated?._id) {
          return redirect(`product/${isProductCreated._id}`)
          // return json({
          //   success: true,
          //   // message: "Success!"
          // })
        }
      }

      break;

    case "DELETE":
      const body = await request.formData()
      const selectedResources = body.get("selectedResources")
      if (!!selectedResources) {
        const found_products = await Products.findById(selectedResources)
        console.log('found_products', found_products)

        // await deleteFile(found_colors.filePath)

        const isDeleted = await Products.findByIdAndDelete(selectedResources)
        console.log('isDeleted', isDeleted)
      }

      break;
  
    default:
      break;
  }

  return json({
    success: true
  });
}

export default function Index() {

  const navigate = useNavigate()
  const navigation = useNavigation()
  const loaderData = useLoaderData()
  const actionData = useActionData()
  const fetcher    = useFetcher()
  const submit = useSubmit()
  const isLoading = ["loading", "submitting"].includes(navigation.state);
  // const productId = actionData?.product?.id.replace(
  //   "gid://shopify/Product/",
  //   ""
  // );

  const [products, setProducts] = useState([])
  const [pageInfo, setPageInfo] = useState({
    hasPreviousPage: false,
    hasNextPage: false,
    startCursor: "",
    endCursor: ""
  })

  // useEffect(() => {
  //   if (productId) {
  //     shopify.toast.show("Product created");
  //   }
  // }, [productId]);

  useEffect(() => {
    console.log('useEffect loaderData', loaderData)
    setProducts(loaderData.products)
    setPageInfo(loaderData.pageInfo)
  }, [loaderData])

  useEffect(() => {
    if (!!fetcher.data) {
      console.log('fetcher.data', fetcher.data)
      setProducts(fetcher.data.products)
      setPageInfo(fetcher.data.pageInfo)
    }
  }, [fetcher.data])

  useEffect(() => {
    console.log('useEffect actionData', actionData)

  }, [actionData])

  // const generateProduct = () => submit({}, { replace: true, method: "POST" });

  const {selectedResources, allResourcesSelected, handleSelectionChange, clearSelection} = useIndexResourceState(products, false)

  const onClickProductEditHandler = () => {
    navigate(`/app/product/${selectedResources[0]}`)
  }

  const onClickProductDeleteHandler = () => {
    console.log('selectedResources', selectedResources)
    submit({ selectedResources: selectedResources }, { replace: true, method: "DELETE" })
    clearSelection()
  }

  const onClickAddProductHandler = async () => {

    let resourcePickerOptions = {
      type: 'product'
    }
    const selected = await shopify.resourcePicker(resourcePickerOptions)

    console.log('selected', selected)

    if (!!selected && selected.length) {
      const productInfo = selected[selected.length-1]
      console.log('productInfo', productInfo)

      const formData = new FormData()
      formData.append('product_id', productInfo.id)
      formData.append('product_title', productInfo.title)

      if (!!productInfo.images && productInfo.images.length) {
        const productImage = productInfo.images[0]
        if (!!productImage.originalSrc) {
          formData.append('product_image', productImage.originalSrc)
        }
      }

      formData.append('product_price', productInfo?.variants?.[0]?.price)
      formData.append('product_sku', productInfo?.variants?.[0]?.sku)

      let product_type = ''
      if (productInfo.tags.length) {
        const found_product_type = productInfo.tags.find(tag => tag.includes('ProductType_'))
        if (!!found_product_type) {
          product_type = found_product_type.split('_')?.[1]
        }
      }
      formData.append('product_type', product_type)

      console.log('formData', formData)
  
      submit(formData, { replace: true, method: "POST" })
    }
  }

  return (
    <Page
      title="Products"
      primaryAction={{
        content: 'Add Product',
        onAction: onClickAddProductHandler
      }}
    >
      {/* <ui-title-bar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </ui-title-bar> */}
      {/* <ui-title-bar title="Products">
        <button variant="primary" onClick={onClickAddProductHandler}>
          Add Product
        </button>
      </ui-title-bar> */}
      {/* <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Congrats on creating a new Shopify app 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This embedded app template uses{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/app-bridge"
                      target="_blank"
                      removeUnderline
                    >
                      App Bridge
                    </Link>{" "}
                    interface examples like an{" "}
                    <Link url="/app/additional" removeUnderline>
                      additional page in the app navigation
                    </Link>
                    , as well as an{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql"
                      target="_blank"
                      removeUnderline
                    >
                      Admin GraphQL
                    </Link>{" "}
                    mutation demo, to provide a starting point for app
                    development.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Get started with products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate a product with GraphQL and get the JSON output for
                    that product. Learn more about the{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                      target="_blank"
                      removeUnderline
                    >
                      productCreate
                    </Link>{" "}
                    mutation in our API references.
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>
                  {actionData?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {actionData?.product && (
                  <Box
                    padding="400"
                    background="bg-surface-active"
                    borderWidth="025"
                    borderRadius="200"
                    borderColor="border"
                    overflowX="scroll"
                  >
                    <pre style={{ margin: 0 }}>
                      <code>{JSON.stringify(actionData.product, null, 2)}</code>
                    </pre>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify’s API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack> */}

      <div className="rca-indextable">

        <IndexTable
          resourceName={{
            singular: 'product',
            plural: 'products'
          }}
          itemCount={products.length}
          selectedItemsCount={ allResourcesSelected ? '' : selectedResources.length }
          onSelectionChange={(selectionType, isSelecting, selection) => {
            clearSelection()
            if ( ( selectionType === 'single' ) && (!!isSelecting) ) {
              handleSelectionChange(selectionType, isSelecting, selection)
            }
          }}
          headings={[
            { title: '' },
            { title: 'Title' },
          ]}
          promotedBulkActions={[
            {
              content: "Edit",
              onAction: onClickProductEditHandler
            },
            {
              content: "Delete",
              onAction: onClickProductDeleteHandler
            }
          ]}
        >
          {products.map(
            ({_id, product_id, product_title, product_image}, index) => (
              <IndexTable.Row
                id={_id}
                key={_id}
                selected={selectedResources.includes(_id)}
                position={index}
              >
                <IndexTable.Cell>
                  <Thumbnail source={product_image} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text variant="bodyMd" fontWeight="bold" as="span">
                    {product_title}
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            ),
          )}
        </IndexTable>

      </div>

      <div
        style={{
          width: 'fit-content',
          margin: 'auto',
          marginTop: '2em'
        }}
      >
        <Pagination
          hasPrevious={pageInfo.hasPreviousPage}
          hasNext={pageInfo.hasNextPage}
          onPrevious={() => {
            console.log('Previous')
            // fetcher.load(`?query=${queryValue}&type=${tabName}`)
            // fetcher.load(`?prevOrNext=prev&cursor=${1}`)
            fetcher.submit({ prevOrNext: 'prev', cursor: pageInfo.startCursor }, { replace: false })
          }}
          onNext={() => {
            console.log('Next')
            // fetcher.load(`/index?prevOrNext=next&cursor=${2}`)
            fetcher.submit({ prevOrNext: 'next', cursor: pageInfo.endCursor }, { replace: false })
          }}
        />
      </div>
    </Page>
  );
}
