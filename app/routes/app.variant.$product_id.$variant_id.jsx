import { BlockStack, Box, FormLayout, InlineStack, Layout, LegacyCard, Page, Text, TextField } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { Products } from "../db.server";
import { useEffect, useReducer } from "react";
import CreatableSelect from "react-select/creatable";

import variantStyles from "~/styles/variant.css";

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

export default function Variant() {

    const navigate = useNavigate()
    const params = useParams()
    const loaderData = useLoaderData()

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
    console.log('productData', productData)

    useEffect(() => {
        console.log('loaderData', loaderData)

        dispatchProductData({
            id: loaderData.product._id,
            product_id: loaderData.product.product_id,
            product_title: loaderData.product.product_title,
            options: !!loaderData?.product?.options ? loaderData.product.options : [],
        })

    }, [loaderData])


    return (
        <Page
            backAction={{
                content: '',
                url: `/app/product/${params.product_id}`
            }}
            title="Add variant"
            primaryAction={{
                content: 'Save Variant',
                onAction: () => {
                    console.log('Save Variant');
                }
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
                                        productData.options.map(optn => {
                                            return (
                                                <FormLayout>
                                                    {/* <TextField label={optn.option_title} /> */}
                                                    <CreatableSelect
                                                        isLoading={false}
                                                        isClearable
                                                        isSearchable
                                                        options={optn.option_values.map(ov => {
                                                            return { value: ov.option_value_id, label: ov.option_value_title }
                                                        })}
                                                        placeholder={`Select ${optn.option_title}`}
                                                    />
                                                </FormLayout>
                                            )
                                        })
                                    }
                                </BlockStack>
                            </div>
                        </Box>
                    </LegacyCard>
                </Layout.Section>
            </Layout>
        </Page>
    )
}