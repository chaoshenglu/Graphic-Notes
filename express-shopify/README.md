示例代码（Node.js + @shopify/shopify-api + graphql 请求）

const { shop, accessToken } = session;
const gqlEndpoint = `https://${shop}/admin/api/2023-10/graphql.json`;

const query = `
mutation {
  productUpdate(input: {
    id: "gid://shopify/Product/${productId}",
    seo: {
      title: "${seo_title}",
      description: "${seo_description}"
    }
  }) {
    product {
      id
      seo {
        title
        description
      }
    }
    userErrors {
      field
      message
    }
  }
}`;

const response = await fetch(gqlEndpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": accessToken
  },
  body: JSON.stringify({ query })
});

const result = await response.json();
console.log(result);
