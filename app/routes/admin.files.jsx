import { json } from "@remix-run/node"
import { authenticate } from "../shopify.server"
import { Files } from "../db.server"

export const loader = async ({ request }) => {
    await authenticate.admin(request)

    const files = await Files.find()

    return json({
        success: true,
        data: files
    })
}