// 根据ID获取产品详情
axios.get(`https://api.tiffanylamps.com.cn/products/${id}`)

// 响应：
{
  "success": true,
  "data": {
    "product_id": "784348566976",
    "title_cn": "HAUTY 17寸欧式宫廷伞形落地灯低调奢华英式简约客厅书房卧室台灯"
...
  }
}