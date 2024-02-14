import { authenticate } from "../shopify.server";
import db, { Products, Session } from "../db.server";

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

    const productTypes = [
      'ProductType_Ring',
      'ProductType_Earrings',
      'ProductType_Pendant'
    ]

    if (!productTags.length) {
      return
    }

    const whichProductType = productTags.find(productTag => productTypes.includes(productTag))
    if (!whichProductType) {
      return
    }

    console.log('whichProductType', whichProductType)

    let productData = await Products.findOne({
      product_id: productPayload.admin_graphql_api_id
    })

    if (!productData) {
      productData = await Products.create({
        product_id: productPayload.admin_graphql_api_id,
        product_title: productPayload.title,
        product_image: productPayload.image
      })
      if (!productData) {
        return
      }
    }

    console.log('productData', productData)

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