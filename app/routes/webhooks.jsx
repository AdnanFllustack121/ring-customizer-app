import { authenticate } from "../shopify.server";
import db, { Products, Session } from "../db.server";

import { makeid } from "../utils";

import ProductTypes from "../../json/productTypes.json";
import Options from "../../json/options.json"

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        // await db.session.deleteMany({ where: { shop } });

        await Session.deleteMany({ shop })
      }

      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      throw new Response();

    case "PRODUCTS_CREATE":
    case "PRODUCTS_UPDATE":
      // throw new Response()
      productsCreateOrUpdatehandler(payload)
      break;
    case "PRODUCTS_DELETE":
      productsDeleteHandler(payload)
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};


const productsCreateOrUpdatehandler = async (productPayload) => {
  console.log('productsCreateOrUpdatehandler productPayload', productPayload)

  try {
    const productTags = productPayload.tags.split(', ')

    console.log('productTags', productTags)

    const productTypes = ProductTypes.map(rule => rule.shopify_Tag)

    if (!productTags.length) {
      return
    }

    const whichProductType = productTags.find(productTag => productTypes.includes(productTag))
    if (!whichProductType) {
      return
    }

    // console.log('whichProductType', whichProductType)

    let productData = await Products.findOne({
      product_id: productPayload.admin_graphql_api_id
    })

    if (!productData) {
      productData = await Products.create({
        product_id: productPayload.admin_graphql_api_id,
        product_title: productPayload.title,
        product_image: !!productPayload.image?.src ? productPayload.image.src : null
      })
      if (!productData) {
        return
      }
    }

    let options = []

    console.log('productData', productData)

    for (let index = 0; index < Options.length; index++) {
      const option = Options[index]
      const option_values = option.values

      console.log('option_values', option_values)

      const found_option_values = option_values.filter(options_value => productTags.includes(options_value.Shopify_Tag))
      console.log('found_option_values', found_option_values)

      if (!found_option_values.length) {
        continue;
      }

      options.push({
        option_id: makeid(24),
        option_title: option.name,
        option_type: 'swatch',
        option_slug: option.slug,
        option_values: found_option_values.map(found_option_value => {
          return {
            file_id: '',
            option_value_id: makeid(24),
            option_value_title: found_option_value.optionValueTitle,
            option_value_slug: found_option_value.optionValue_Short,
            option_image_path: '',
            option_value_price: ''
          }
        })
      })
    }

    console.log('options', options)

    if (!!options.length) {
      await Products.findOneAndUpdate({
        product_id: productPayload.admin_graphql_api_id
      }, {
        options
      })
    }

  } catch (error) {
    
  }
}

const productsDeleteHandler = async ({ id }) => {
  console.log('productsDeleteHandler id', id)


  const productDataDelete = await Products.deleteOne({
    product_id: `gid://shopify/Product/${id}`
  })
  console.log('productDataDelete', productDataDelete)

}