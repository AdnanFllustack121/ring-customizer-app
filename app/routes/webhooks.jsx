import { authenticate } from "../shopify.server";
import db, { Products, Session } from "../db.server";

import { generateMedias, generateVariations, makeid, shopifyRest } from "../utils";

import ProductTypes from "../../json/productTypes.json";
import optionsJson from "../../json/options.json"
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
      productsCreateOrUpdateHandler(payload)
      break;
    case "PRODUCTS_DELETE":
      productsDeleteHandler(payload)
      break;


    case "ORDERS_CREATE":
      ordersCreateHandler(payload)
      break;


    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};


const productsCreateOrUpdateHandler = async (productPayload) => {

  // console.log('productsCreateOrUpdateHandler START', productPayload)

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
        product_price: productPayload.variants?.[0]?.price,
        product_sku: productPayload.variants?.[0]?.sku,
        product_type: whichProductType.split('_')?.[1]
      })
      if (!productData) {
        return
      }
    }

    let options = []

    for (let index = 0; index < optionsJson.length; index++) {
      const optionJsonSingle = optionsJson[index]


      if (optionJsonSingle?.addOnlyWhen) {
        // console.log('optionJsonSingle.addOnlyWhen', optionJsonSingle.addOnlyWhen)

        if (typeof optionJsonSingle.addOnlyWhen === "string") {
          if (!options.find(option => option.option_slug === optionJsonSingle.addOnlyWhen)) {
            continue;
          }
        } else {

        }

      }


      const option_values = optionJsonSingle.values

      let found_option_values = []

      if (
        (
          ( optionJsonSingle.ProductType === 'all' ) ||
          ( optionJsonSingle.ProductType === whichProductType ) ||
          optionJsonSingle.ProductType.includes(whichProductType)
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


      const option_to_push = {
        option_id: makeid(24),
        option_title: optionJsonSingle.name,
        option_type: 'swatch',
        option_slug: optionJsonSingle.slug,
        option_display_when: !!optionJsonSingle?.showOnlyWhen ? {
          option_slug: optionJsonSingle.showOnlyWhen.optionSlug,
          option_value_slug: optionJsonSingle.showOnlyWhen.optionValueSlug
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
            option_value_slug: !!found_option_value?.optionValue_Short ? found_option_value.optionValue_Short : (
              !!found_option_value?.optionValueTitle ? found_option_value.optionValueTitle : found_option_value
            ),
            option_image_path: (
              !!found_option_value?.optionValue_PicPath && existsSync(`${__dirname}/../public/options/${found_option_value.optionValue_PicPath}`)
            ) ? `/options/${found_option_value.optionValue_PicPath}` : null,
            option_value_price: ''
          }
        })
      }

      options.push(option_to_push)


    }

    if (!!options.length) {

      // const the_variations = generateVariations(options)
      // console.log('the_variations', the_variations)

      await Products.findOneAndUpdate({
        product_id: productPayload.admin_graphql_api_id
      }, {
        options
      })


      // Media START
      let product = await Products.findOne({
        product_id: productPayload.admin_graphql_api_id
      })
      // console.log('productsCreateOrUpdateHandler product', product)


      const the_medias = generateMedias(product)
      // console.log('productsCreateOrUpdateHandler the_medias', the_medias)


      await Products.findOneAndUpdate({
        product_id: productPayload.admin_graphql_api_id
      }, {
        medias: the_medias
      })
      // Media END

    }

    // console.log('productsCreateOrUpdateHandler END')

  } catch (error) {
    console.log('productsCreateOrUpdateHandler error', error)
  }
}


const productsDeleteHandler = async ({ id }) => {
  console.log('productsDeleteHandler id', id)


  const productDataDelete = await Products.deleteOne({
    product_id: `gid://shopify/Product/${id}`
  })
  console.log('productDataDelete', productDataDelete)

}


const ordersCreateHandler = async (orderPayload) => {
  console.log('ordersCreateHandler START orderPayload', orderPayload)

  const custom_product_ids = []

  orderPayload.line_items.forEach((line_item) => {

    if (line_item.vendor.includes('related_to_')) {
      custom_product_ids.push(line_item.product_id)
    }

  })

  console.log('custom_product_ids', custom_product_ids)

  const session = await Session.findOne()

  custom_product_ids.forEach(async custom_product_id => {
    const deleteProduct = await shopifyRest({
      session,
      method: "DELETE",
      path: `products/${custom_product_id}.json`,
    })
    console.log('deleteProduct')
  })


  console.log('ordersCreateHandler END')
}