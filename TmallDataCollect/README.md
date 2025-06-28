const updateData = {
      ...productData.value,
      title_en: newTitleEn
    }
await axios.put(`https://api.tiffanylamps.com.cn/products/${productId}`, updateData)