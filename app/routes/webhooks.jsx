import { authenticate } from "../shopify.server";
import db, { Products, Session } from "../db.server";

import { generateVariations, makeid } from "../utils";

import ProductTypes from "../../json/productTypes.json";
import Options from "../../json/options.json"
import { existsSync } from "fs";

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

  console.log('productsCreateOrUpdatehandler START', productPayload)

  try {
    const productTags = productPayload.tags.split(', ')

    const productTypes = ProductTypes.map(rule => rule.shopify_Tag)

    if (!productTags.length) {
      return
    }

    const whichProductType = productTags.find(productTag => productTypes.includes(productTag))
    if (!whichProductType) {
      return
    }

    let productData = await Products.findOne({
      product_id: productPayload.admin_graphql_api_id
    })

    if (!productData) {
      productData = await Products.create({
        product_id: productPayload.admin_graphql_api_id,
        product_title: productPayload.title,
        product_image: !!productPayload.image?.src ? productPayload.image.src : null,
        product_sku: !!productPayload.variants?.[0]?.sku
      })
      if (!productData) {
        return
      }
    }

    let options = []

    for (let index = 0; index < Options.length; index++) {
      const option = Options[index]
      const option_values = option.values

      let found_option_values = []

      if (
        (
          ( option.ProductType === 'all' ) ||
          ( option.ProductType === whichProductType )
        )
        &&
        !!option_values.length
      ) {
        // check for the tag key
        if (!!option_values?.[0]?.Shopify_Tag) {
          found_option_values = option_values.filter(options_value => productTags.includes(options_value.Shopify_Tag))
        } else {
          found_option_values = option_values
        }
      }


      if (!found_option_values.length) {
        continue;
      }

      options.push({
        option_id: makeid(24),
        option_title: option.name,
        option_type: 'swatch',
        option_slug: option.slug,
        option_display_when: !!option?.showOnlyWhen ? {
          option_slug: option.showOnlyWhen.optionSlug,
          option_value_slug: option.showOnlyWhen.optionValueSlug
        } : null,
        option_values: found_option_values.filter(found_option_value => {
          if (!!found_option_value?.ProductType) {
            if (
              (found_option_value.ProductType === "all") ||
              found_option_value.ProductType.includes(whichProductType)
            ) {
              return true
            } else {
              return false
            }
          } else {
            return true
          }
        }).map(found_option_value => {
          return {
            file_id: '',
            option_value_id: makeid(24),
            option_value_title: !!found_option_value?.optionValueTitle ? found_option_value.optionValueTitle : found_option_value,
            option_value_slug: !!found_option_value?.optionValue_Short ? found_option_value.optionValue_Short : found_option_value,
            option_image_path: (
              !!found_option_value?.optionValue_PicPath && existsSync(`${__dirname}/../public/options/${found_option_value.optionValue_PicPath}`)
            ) ? `/options/${found_option_value.optionValue_PicPath}` : null,
            option_value_price: ''
          }
        })
      })
    }

    if (!!options.length) {

      // const the_variations = generateVariations(options)
      // console.log('the_variations', the_variations)

      await Products.findOneAndUpdate({
        product_id: productPayload.admin_graphql_api_id
      }, {
        options
      })

    }

    console.log('productsCreateOrUpdatehandler END')

  } catch (error) {
    console.log('productsCreateOrUpdatehandler error', error)
  }
}


const productsDeleteHandler = async ({ id }) => {
  console.log('productsDeleteHandler id', id)


  const productDataDelete = await Products.deleteOne({
    product_id: `gid://shopify/Product/${id}`
  })
  console.log('productDataDelete', productDataDelete)

}